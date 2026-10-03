// src/lib/ai/providers.ts
// Sohbet (metin üretimi) için çoklu-sağlayıcı fallback zinciri.
// Biri kota/hata verince sıradaki ücretsiz sağlayıcıya düşer.
// NOT: Yalnızca sohbet için. Embedding tek modelde kalır (vektör uyumu).
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Provider {
  name: string;
  generate: (prompt: string) => Promise<string>;
}

/** OpenAI-uyumlu (chat/completions) sağlayıcı adaptörü — Groq, OpenRouter, Cerebras, Mistral. */
function openAiCompatible(name: string, baseUrl: string, apiKey: string, model: string): Provider {
  return {
    name,
    async generate(prompt: string) {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`${name} ${res.status}: ${body.slice(0, 200)}`);
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error(`${name}: boş yanıt`);
      return text;
    },
  };
}

function geminiProvider(apiKey: string, model: string): Provider {
  return {
    name: "gemini",
    async generate(prompt: string) {
      const genAI = new GoogleGenerativeAI(apiKey);
      const m = genAI.getGenerativeModel({ model });
      const r = await m.generateContent(prompt);
      const text = r.response.text();
      if (!text) throw new Error("gemini: boş yanıt");
      return text;
    },
  };
}

/** env'de anahtarı olan sağlayıcıları sırayla döndürür (öncelik sırası). */
function buildChain(): Provider[] {
  const chain: Provider[] = [];
  const e = process.env;

  if (e.GEMINI_API_KEY) {
    chain.push(geminiProvider(e.GEMINI_API_KEY, e.GEMINI_CHAT_MODEL || "gemini-2.5-flash"));
  }
  if (e.GROQ_API_KEY) {
    chain.push(openAiCompatible("groq", "https://api.groq.com/openai/v1", e.GROQ_API_KEY, e.GROQ_MODEL || "openai/gpt-oss-120b"));
  }
  if (e.CEREBRAS_API_KEY) {
    chain.push(openAiCompatible("cerebras", "https://api.cerebras.ai/v1", e.CEREBRAS_API_KEY, e.CEREBRAS_MODEL || "qwen-3.8-27b"));
  }
  if (e.OPENROUTER_API_KEY) {
    chain.push(openAiCompatible("openrouter", "https://openrouter.ai/api/v1", e.OPENROUTER_API_KEY, e.OPENROUTER_MODEL || "qwen/qwen3.8-27b:free"));
  }
  if (e.MISTRAL_API_KEY) {
    chain.push(openAiCompatible("mistral", "https://api.mistral.ai/v1", e.MISTRAL_API_KEY, e.MISTRAL_MODEL || "mistral-small-latest"));
  }
  return chain;
}

/**
 * Sohbet yanıtı üretir: zincirdeki ilk çalışan sağlayıcıyı kullanır.
 * Bir sağlayıcı hata/kota verirse sıradakine geçer. Hepsi tükenirse son hatayı fırlatır.
 * Dönüşte hangi sağlayıcının yanıtladığı da gelir (gözlemlenebilirlik için).
 */
export async function generateChat(prompt: string): Promise<{ text: string; provider: string }> {
  const chain = buildChain();
  if (chain.length === 0) throw new Error("Hiçbir AI sağlayıcısı yapılandırılmamış.");

  let lastErr: unknown;
  for (const p of chain) {
    try {
      const text = await p.generate(prompt);
      return { text, provider: p.name };
    } catch (err) {
      lastErr = err;
      console.warn(`[ai] sağlayıcı "${p.name}" başarısız, sıradakine geçiliyor:`, String(err).slice(0, 180));
    }
  }
  throw new Error("Tüm AI sağlayıcıları başarısız oldu: " + String(lastErr).slice(0, 180));
}
