"use client";

import { useState } from "react";
import Link from "next/link";

interface Flashcard {
  soru: string;
  cevap: string;
}

export function AiTools({
  noteId,
  isPro,
}: {
  noteId: string;
  isPro: boolean;
}) {
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState("");

  if (!isPro) {
    return (
      <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5">
        <h3 className="font-heading text-lg text-foreground">
          🚀 AI Çalışma Araçları
        </h3>
        <p className="mt-1 text-sm text-muted">
          Soru üretici, flashcard ve &quot;nota soru sor&quot; Pro üyelere
          özeldir.
        </p>
        <Link
          href="/premium"
          className="mt-3 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Pro&apos;ya yükselt
        </Link>
      </div>
    );
  }

  async function call(
    endpoint: string,
    body: object,
    onOk: (data: Record<string, unknown>) => void,
    key: string,
  ) {
    setLoading(key);
    setError("");
    try {
      const res = await fetch(`/api/ai/${endpoint}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Hata oluştu.");
      else onOk(data);
    } catch {
      setError("Bağlantı hatası.");
    }
    setLoading("");
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h3 className="font-heading text-lg text-card-foreground">
        🚀 AI Çalışma Araçları
      </h3>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() =>
            call("questions", { noteId }, (d) => setQuestions(d.text as string), "q")
          }
          disabled={!!loading}
          className="rounded-lg border border-accent/40 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent hover:text-primary-foreground disabled:opacity-50"
        >
          {loading === "q" ? "Üretiliyor..." : "📝 Soru Üret"}
        </button>
        <button
          onClick={() =>
            call(
              "flashcards",
              { noteId },
              (d) => setCards((d.cards as Flashcard[]) ?? []),
              "f",
            )
          }
          disabled={!!loading}
          className="rounded-lg border border-accent/40 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent hover:text-primary-foreground disabled:opacity-50"
        >
          {loading === "f" ? "Üretiliyor..." : "🃏 Flashcard"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {questions && (
        <div className="whitespace-pre-wrap rounded-lg border border-border bg-background/40 p-3 text-sm text-foreground">
          {questions}
        </div>
      )}

      {cards.length > 0 && (
        <div className="space-y-2">
          {cards.map((c, i) => (
            <details
              key={i}
              className="rounded-lg border border-border bg-background/40 p-3"
            >
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                {c.soru}
              </summary>
              <p className="mt-2 text-sm text-muted">{c.cevap}</p>
            </details>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (question.trim())
              call(
                "ask",
                { noteId, question },
                (d) => setAnswer(d.text as string),
                "a",
              );
          }}
          className="flex gap-2"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Bu nota soru sor..."
            className="flex-1 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
          />
          <button
            type="submit"
            disabled={!!loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading === "a" ? "..." : "Sor"}
          </button>
        </form>
        {answer && (
          <div className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-background/40 p-3 text-sm text-foreground">
            {answer}
          </div>
        )}
      </div>
    </div>
  );
}
