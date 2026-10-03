import { NextResponse, type NextRequest } from "next/server";
import { proNoteGuard } from "@/lib/ai/guard";
import { geminiFromPdf } from "@/lib/ai/gemini";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { noteId, question } = body;
  const g = await proNoteGuard(noteId);
  if (g.error) return g.error;

  if (!question || !String(question).trim()) {
    return NextResponse.json({ error: "Soru gerekli." }, { status: 400 });
  }

  let text: string | null;
  try {
    text = await geminiFromPdf(
      g.note.file_url,
      `Aşağıdaki ders notuna dayanarak şu soruyu Türkçe yanıtla: "${String(
        question,
      ).trim()}". Yalnızca nottaki bilgilere dayan; nottan çıkaramıyorsan bunu belirt.`,
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Yanıtlanamadı." },
      { status: 500 },
    );
  }
  if (!text)
    return NextResponse.json(
      { error: "AI yapılandırılmamış (GEMINI_API_KEY eksik)." },
      { status: 503 },
    );

  return NextResponse.json({ text });
}
