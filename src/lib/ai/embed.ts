// src/lib/ai/embed.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBED_MODEL = "text-embedding-004";

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY eksik");
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: EMBED_MODEL });
}

/** Tek bir metni 768 boyutlu vektöre çevirir. */
export async function embedText(text: string): Promise<number[]> {
  const model = client();
  const res = await model.embedContent(text);
  return res.embedding.values;
}

/** Birden çok metni sırayla embedding'e çevirir. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const out: number[][] = [];
  for (const t of texts) out.push(await embedText(t));
  return out;
}
