import { NextResponse, type NextRequest } from "next/server";
import { proNoteGuard } from "@/lib/ai/guard";
import { geminiFromPdf } from "@/lib/ai/gemini";

interface Flashcard {
  soru: string;
  cevap: string;
}

export async function POST(request: NextRequest) {
  const { noteId } = await request.json().catch(() => ({}));
  const g = await proNoteGuard(noteId);
  if (g.error) return g.error;

  let raw: string | null;
  try {
    raw = await geminiFromPdf(
      g.note.file_url,
      'Bu ders notundan 6 adet çalışma kartı (flashcard) üret. SADECE şu ' +
        'formatta geçerli bir JSON dizisi döndür, başka hiçbir metin yazma: ' +
        '[{"soru":"...","cevap":"..."}]',
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Üretilemedi." },
      { status: 500 },
    );
  }
  if (!raw)
    return NextResponse.json(
      { error: "AI yapılandırılmamış (GEMINI_API_KEY eksik)." },
      { status: 503 },
    );

  let cards: Flashcard[] = [];
  try {
    const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      cards = parsed.filter((c) => c && c.soru && c.cevap);
    }
  } catch {
    // parse başarısızsa boş kart döner, ham metin de gönderilir
  }

  return NextResponse.json({ cards, raw });
}
