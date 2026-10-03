// src/lib/ai/studio.ts
// Çalışma alanı "Stüdyo" çıktıları: seçili kaynak notlardan rehber/özet/SSS/quiz/flashcard üretir.

export const STUDIO_KINDS = ["guide", "summary", "faq", "quiz", "flashcards"] as const;
export type StudioKind = (typeof STUDIO_KINDS)[number];

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  explanation: string;
}
export interface Flashcard {
  front: string;
  back: string;
}

export type StudioResult =
  | { kind: "guide" | "summary" | "faq"; markdown: string }
  | { kind: "quiz"; questions: QuizQuestion[] }
  | { kind: "flashcards"; cards: Flashcard[] };

const BASE =
  `Notvia çalışma asistanısın. Aşağıdaki ders notu metnine dayanarak Türkçe çıktı üret. ` +
  `Yalnızca metindeki bilgileri kullan, uydurma. Metin yetersizse daha az ama doğru içerik üret.\n`;

const TASKS: Record<StudioKind, string> = {
  guide:
    `GÖREV: Sınava hazırlanan öğrenci için ÇALIŞMA REHBERİ yaz. Markdown kullan:\n` +
    `## Öğrenme Hedefleri\n3-6 madde.\n` +
    `## Konular\nHer konu için ### başlık, 2-4 cümle açıklama ve **anahtar terimler**.\n` +
    `## Kendini Test Et\nCevabı verilmeyen 5 açık uçlu soru.\n` +
    `## Önerilen Çalışma Sırası\nNumaralı kısa adımlar.\nTablo ve HTML kullanma.`,
  summary:
    `GÖREV: Notları ÖZETLE. Markdown kullan:\n` +
    `## Genel Bakış\n1-2 cümle.\n## Ana Konular\nKısa maddeler.\n` +
    `## Önemli Tanımlar\n- **Terim**: tanım\n## Sınav İçin Kritik Noktalar\n3-6 madde.\nTablo ve HTML kullanma.`,
  faq:
    `GÖREV: Öğrencilerin bu notlar hakkında sorabileceği 8-10 SIK SORULAN SORU ve cevabını yaz. ` +
    `Markdown: her soru "### Soru metni?" başlığı, altında 1-3 cümle cevap. Tablo ve HTML kullanma.`,
  quiz:
    `GÖREV: 8 adet çoktan seçmeli sınav sorusu üret. Her sorunun 4 şıkkı olsun, yalnızca biri doğru; ` +
    `kolaydan zora sırala. YALNIZCA şu biçimde geçerli JSON döndür, başka hiçbir şey yazma:\n` +
    `{"questions":[{"q":"soru","options":["A şıkkı","B şıkkı","C şıkkı","D şıkkı"],"answer":0,"explanation":"neden doğru, 1-2 cümle"}]}\n` +
    `"answer" doğru şıkkın 0 tabanlı indeksidir. Şıklara harf ön eki koyma.`,
  flashcards:
    `GÖREV: 12 adet bilgi kartı (flashcard) üret: ön yüz kısa bir terim ya da soru, arka yüz 1-2 cümlelik cevap. ` +
    `YALNIZCA şu biçimde geçerli JSON döndür, başka hiçbir şey yazma:\n` +
    `{"cards":[{"front":"ön yüz","back":"arka yüz"}]}`,
};

export function buildStudioPrompt(kind: StudioKind, text: string): string {
  return `${BASE}${TASKS[kind]}\n\n=== DERS NOTU METNİ ===\n${text}`;
}

function extractJson(raw: string): unknown {
  const cleaned = raw.replace(/```(?:json)?/gi, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("JSON bulunamadı");
  return JSON.parse(cleaned.slice(start, end + 1));
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Model çıktısını doğrulayıp tipli sonuca çevirir; bozuk öğeler atlanır. */
export function parseStudioOutput(kind: StudioKind, raw: string): StudioResult {
  if (kind === "quiz") {
    const data = extractJson(raw) as { questions?: unknown[] };
    const questions = (data.questions ?? [])
      .map((x) => {
        const o = x as Record<string, unknown>;
        const options = Array.isArray(o.options) ? o.options.map(str).filter(Boolean) : [];
        const answer = Number(o.answer);
        return { q: str(o.q), options, answer, explanation: str(o.explanation) };
      })
      .filter((x) => x.q && x.options.length >= 2 && Number.isInteger(x.answer) && x.answer >= 0 && x.answer < x.options.length);
    if (questions.length === 0) throw new Error("Geçerli soru üretilemedi");
    return { kind, questions };
  }
  if (kind === "flashcards") {
    const data = extractJson(raw) as { cards?: unknown[] };
    const cards = (data.cards ?? [])
      .map((x) => {
        const o = x as Record<string, unknown>;
        return { front: str(o.front), back: str(o.back) };
      })
      .filter((c) => c.front && c.back);
    if (cards.length === 0) throw new Error("Geçerli kart üretilemedi");
    return { kind, cards };
  }
  const markdown = raw.trim();
  if (!markdown) throw new Error("Boş yanıt");
  return { kind, markdown };
}
