// src/lib/ai/chat.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { retrieveContext } from "./retrieve";
import { generateChat } from "./providers";

export async function answerQuestion(
  admin: SupabaseClient,
  question: string,
  scope: { type: "all" | "course"; courseId?: string | null },
): Promise<{ answer: string; sources: { noteId: string }[] }> {
  const context = await retrieveContext(admin, question, scope);
  if (context.length === 0) {
    return {
      answer:
        "Bu konuda indekslenmiş not bulamadım. İlgili dersten metin içeren bir PDF not yüklenmişse tekrar dene.",
      sources: [],
    };
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
    `- Mümkünse ilgili kaynak numarasına atıf yap.\n\n` +
    `=== KAYNAKLAR ===\n${contextText}\n\n=== SORU ===\n${question}`;

  // Çoklu-sağlayıcı fallback: Gemini kota verirse Groq/Cerebras/OpenRouter/Mistral'a düşer
  const { text } = await generateChat(prompt);
  const answer = text || "Yanıt üretilemedi.";

  const sources = [...new Set(context.map((c) => c.noteId))].map((noteId) => ({ noteId }));
  return { answer, sources };
}
