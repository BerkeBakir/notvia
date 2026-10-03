// src/lib/ai/chat.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { retrieveContext } from "./retrieve";
import { generateChat } from "./providers";

const EMPTY_ANSWER =
  "Bu konuda indekslenmiş not bulamadım. İlgili dersten metin içeren bir PDF not yüklenmişse tekrar dene.";

/**
 * Soru için RAG bağlamını getirir ve prompt'u kurar.
 * Bağlam yoksa { empty: true } döner (model çağrısı yapılmaz).
 * Hem normal hem streaming yol bunu paylaşır (DRY).
 */
export async function prepareAnswer(
  admin: SupabaseClient,
  question: string,
  scope: { type: "all" | "course"; courseId?: string | null },
): Promise<
  | { empty: true; answer: string; sources: [] }
  | { empty: false; prompt: string; sources: { noteId: string }[] }
> {
  const context = await retrieveContext(admin, question, scope);
  if (context.length === 0) {
    return { empty: true, answer: EMPTY_ANSWER, sources: [] };
  }

  const contextText = context
    .map((c, i) => `[Kaynak ${i + 1}]\n${c.content}`)
    .join("\n\n---\n\n");

  const prompt =
    `Notvia adlı not paylaşım platformunun çalışma asistanısın. Görevin, ` +
    `aşağıdaki ders notu parçalarına dayanarak öğrencinin sorusunu yanıtlamak.\n` +
    `Kurallar:\n` +
    `- Türkçe, sade ve öğretici yaz; doğrudan cevaba geç, kendine hitap etme ` +
    `("Sen Notvia" gibi ifadeler kullanma).\n` +
    `- Yalnızca verilen kaynaklardaki bilgilere dayan. Kaynaklarda yoksa ` +
    `"Notlarda bu bilgi yok" de ve kesinlikle uydurma.\n` +
    `- Mümkünse ilgili kaynak numarasına atıf yap.\n` +
    `- Biçim: Markdown kullan; kısa başlıklar (##), madde listeleri (-) ve önemli ` +
    `terimler için **kalın** yaz. Tablo ve HTML kullanma, paragrafları kısa tut.\n\n` +
    `=== KAYNAKLAR ===\n${contextText}\n\n=== SORU ===\n${question}`;

  const sources = [...new Set(context.map((c) => c.noteId))].map((noteId) => ({ noteId }));
  return { empty: false, prompt, sources };
}

/** Normal (streaming olmayan) yanıt. */
export async function answerQuestion(
  admin: SupabaseClient,
  question: string,
  scope: { type: "all" | "course"; courseId?: string | null },
): Promise<{ answer: string; sources: { noteId: string }[] }> {
  const prep = await prepareAnswer(admin, question, scope);
  if (prep.empty) return { answer: prep.answer, sources: prep.sources };
  const { text } = await generateChat(prep.prompt);
  return { answer: text || "Yanıt üretilemedi.", sources: prep.sources };
}
