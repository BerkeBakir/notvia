// src/app/api/ai/studio/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { consumeDailyQuota, refundDailyQuota } from "@/lib/ai/limit";
import { collectNoteText } from "@/lib/ai/retrieve";
import { generateChat } from "@/lib/ai/providers";
import { buildStudioPrompt, parseStudioOutput, STUDIO_KINDS, type StudioKind } from "@/lib/ai/studio";

export const maxDuration = 60;

const isUuid = (v: unknown): v is string =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "AI yapılandırılmamış." }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const kind = body.kind as StudioKind;
  if (!STUDIO_KINDS.includes(kind)) {
    return NextResponse.json({ error: "Geçersiz çıktı türü." }, { status: 400 });
  }
  if (!isUuid(body.courseId)) {
    return NextResponse.json({ error: "Geçerli bir ders gerekli." }, { status: 400 });
  }
  const requested: string[] = Array.isArray(body.noteIds) ? body.noteIds.filter(isUuid).slice(0, 100) : [];
  if (requested.length === 0) {
    return NextResponse.json({ error: "En az bir kaynak seç." }, { status: 400 });
  }

  // Yalnızca bu derse ait notlar kaynak olabilir
  const { data: owned } = await admin
    .from("notes")
    .select("id")
    .eq("course_id", body.courseId)
    .in("id", requested);
  const noteIds = (owned ?? []).map((n) => n.id as string);
  if (noteIds.length === 0) {
    return NextResponse.json({ error: "Seçili kaynaklar bulunamadı." }, { status: 404 });
  }

  const { text } = await collectNoteText(admin, noteIds);
  if (text.length < 200) {
    return NextResponse.json(
      { error: "Seçili notlarda yeterli metin yok (taranmış PDF olabilir). Başka kaynak seç." },
      { status: 422 },
    );
  }

  const quota = await consumeDailyQuota(admin, user.id, user.plan);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: "Günlük AI hakkın doldu.", limitReached: true, remaining: 0 },
      { status: 429 },
    );
  }

  const prompt = buildStudioPrompt(kind, text);
  // JSON türlerinde model ara sıra bozuk çıktı verir: bir kez daha dene
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { text: raw, provider } = await generateChat(prompt);
      const result = parseStudioOutput(kind, raw);
      return NextResponse.json({
        result,
        provider,
        remaining: quota.remaining === Infinity ? null : quota.remaining,
      });
    } catch (err) {
      console.warn(`[ai] stüdyo "${kind}" deneme ${attempt + 1} başarısız:`, String(err).slice(0, 200));
    }
  }

  await refundDailyQuota(admin, user.id, user.plan);
  return NextResponse.json(
    { error: "AI şu anda yoğun ya da çıktı üretilemedi. Biraz sonra tekrar dene." },
    { status: 502 },
  );
}
