import { NextResponse, type NextRequest } from "next/server";
import { proNoteGuard } from "@/lib/ai/guard";
import { geminiFromPdf } from "@/lib/ai/gemini";

export async function POST(request: NextRequest) {
  const { noteId } = await request.json().catch(() => ({}));
  const g = await proNoteGuard(noteId);
  if (g.error) return g.error;

  let text: string | null;
  try {
    text = await geminiFromPdf(
      g.note.file_url,
      "Bu ders notundan 5 adet pratik sınav sorusu üret. Her sorudan hemen " +
        "sonra kısa cevabını ver. Türkçe yaz, numaralandır.",
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Üretilemedi." },
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
