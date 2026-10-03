// src/app/api/ai/chat/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeDailyQuota, refundDailyQuota } from "@/lib/ai/limit";
import { prepareAnswer } from "@/lib/ai/chat";
import { generateChatStream } from "@/lib/ai/providers";

export const maxDuration = 60;

const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  const admin = createAdminClient();
  if (!admin || !process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI yapılandırılmamış." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const message = String(body.message ?? "").trim();
  const scopeType = body.scopeType === "course" ? "course" : "all";
  const scopeCourseId: string | null =
    body.scopeCourseId === "" || body.scopeCourseId == null ? null : body.scopeCourseId;
  if (!message) return NextResponse.json({ error: "Mesaj gerekli." }, { status: 400 });
  if (message.length > 2000) {
    return NextResponse.json({ error: "Mesaj çok uzun (en fazla 2000 karakter)." }, { status: 400 });
  }
  if (scopeType === "course" && !isUuid(scopeCourseId)) {
    return NextResponse.json({ error: "Geçerli bir ders seç." }, { status: 400 });
  }
  // Çalışma alanı: seçili kaynak notlar (opsiyonel)
  let noteIds: string[] | null = null;
  if (Array.isArray(body.noteIds)) {
    const ids: string[] = body.noteIds.filter(isUuid).slice(0, 100);
    noteIds = ids;
    if (ids.length === 0) {
      return NextResponse.json({ error: "En az bir kaynak seç." }, { status: 400 });
    }
  }

  // RAG bağlamı + prompt (gömme + benzerlik). Bağlam yoksa model çağrılmaz.
  const prep = await prepareAnswer(admin, message, { type: scopeType, courseId: scopeCourseId, noteIds });

  // Kota yalnızca model çağrılacaksa (bağlam varsa) tüketilir
  let remaining: number | null = null;
  if (!prep.empty) {
    const quota = await consumeDailyQuota(admin, user.id, user.plan);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "Günlük soru hakkın doldu.",
          remaining: 0,
          limitReached: true,
          plan: user.plan,
        },
        { status: 429 },
      );
    }
    remaining = quota.remaining === Infinity ? null : quota.remaining;
  }

  // Sohbeti bul veya oluştur
  let conversationId = "";
  if (body.conversationId) {
    if (!isUuid(body.conversationId)) {
      if (!prep.empty) await refundDailyQuota(admin, user.id, user.plan);
      return NextResponse.json({ error: "Sohbet bulunamadı." }, { status: 404 });
    }
    const { data: existing } = await admin
      .from("ai_conversations")
      .select("id")
      .eq("id", body.conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existing) {
      if (!prep.empty) await refundDailyQuota(admin, user.id, user.plan);
      return NextResponse.json({ error: "Sohbet bulunamadı." }, { status: 404 });
    }
    conversationId = existing.id;
  } else {
    const { data: conv, error } = await admin
      .from("ai_conversations")
      .insert({
        user_id: user.id,
        scope_type: scopeType,
        scope_course_id: scopeType === "course" ? scopeCourseId : null,
        title: message.slice(0, 60),
      })
      .select("id")
      .single();
    if (error || !conv) {
      if (!prep.empty) await refundDailyQuota(admin, user.id, user.plan);
      return NextResponse.json({ error: "Sohbet oluşturulamadı." }, { status: 500 });
    }
    conversationId = conv.id;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      send({ type: "meta", conversationId, sources: prep.sources, remaining });

      let full = "";
      if (prep.empty) {
        full = prep.answer;
        send({ type: "delta", text: full });
      } else {
        try {
          const onProvider = (info: { provider: string; model: string }) => {
            console.info(`[ai] yanıtlayan sağlayıcı: ${info.provider} (${info.model})`);
            send({ type: "provider", ...info });
          };
          for await (const delta of generateChatStream(prep.prompt, onProvider)) {
            full += delta;
            send({ type: "delta", text: delta });
          }
        } catch (err) {
          console.error(err);
          await refundDailyQuota(admin, user.id, user.plan);
          send({ type: "error", error: "Yanıt üretilemedi, lütfen tekrar dene." });
          controller.close();
          return;
        }
        if (!full) {
          await refundDailyQuota(admin, user.id, user.plan);
          full = "Yanıt üretilemedi.";
          send({ type: "delta", text: full });
        }
      }

      // Kalıcı kayıt (başarılı yanıttan sonra)
      await admin.from("ai_messages").insert({ conversation_id: conversationId, role: "user", content: message });
      await admin.from("ai_messages").insert({
        conversation_id: conversationId,
        role: "assistant",
        content: full,
        sources: prep.sources,
      });

      send({ type: "done" });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
    },
  });
}
