// src/lib/ai/embed.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBED_MODEL = "gemini-embedding-001";
const EMBED_DIM = 768;

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY eksik");
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: EMBED_MODEL });
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Tek bir metni 768 boyutlu vektöre çevirir.
 * Ücretsiz Gemini kotasında 429 alınırsa üstel bekleme ile yeniden dener.
 */
export async function embedText(text: string): Promise<number[]> {
  const model = client();
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await model.embedContent({
        content: { role: "user", parts: [{ text }] },
        outputDimensionality: EMBED_DIM,
        // SDK tipinde outputDimensionality yok; API kabul ediyor
      } as Parameters<typeof model.embedContent>[0]);
      return res.embedding.values;
    } catch (err) {
      const is429 = String(err).includes("429");
      if (is429 && attempt < 3) {
        await sleep(5000 * (attempt + 1)); // 5s, 10s, 15s
        continue;
      }
      throw err;
    }
  }
  throw new Error("Embedding üretilemedi (kota).");
}

/**
 * Birden çok metni sırayla embedding'e çevirir. Ücretsiz kotaya takılmamak
 * için aralara kısa gecikme koyar (büyük notlarda yarım indekslemeyi önler).
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    out.push(await embedText(texts[i]));
    if (i < texts.length - 1) await sleep(300);
  }
  return out;
}
