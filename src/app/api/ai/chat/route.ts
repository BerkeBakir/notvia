// src/app/api/ai/chat/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkDailyLimit } from "@/lib/ai/limit";
import { answerQuestion } from "@/lib/ai/chat";

export const maxDuration = 60;

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
  const scopeCourseId = body.scopeCourseId ?? null;
  if (!message) return NextResponse.json({ error: "Mesaj gerekli." }, { status: 400 });

  const limit = await checkDailyLimit(admin, user.id, user.plan);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Günlük ücretsiz soru hakkın doldu. Pro'ya geçerek sınırsız sor.", remaining: 0 },
      { status: 429 },
    );
  }

  // Sohbeti bul veya oluştur
  let conversationId: string = body.conversationId ?? "";
  if (!conversationId) {
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
      return NextResponse.json({ error: "Sohbet oluşturulamadı." }, { status: 500 });
    }
    conversationId = conv.id;
  }

  await admin.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
  });

  let answer: string;
  let sources: { noteId: string }[];
  try {
    const r = await answerQuestion(admin, message, { type: scopeType, courseId: scopeCourseId });
    answer = r.answer;
    sources = r.sources;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Yanıtlanamadı." },
      { status: 500 },
    );
  }

  await admin.from("ai_messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: answer,
    sources,
  });

  const after = await checkDailyLimit(admin, user.id, user.plan);
  return NextResponse.json({
    conversationId,
    answer,
    sources,
    remaining: after.remaining === Infinity ? null : after.remaining,
  });
}
