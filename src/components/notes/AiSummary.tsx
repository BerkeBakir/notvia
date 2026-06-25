"use client";

import { useState } from "react";
import Link from "next/link";

export function AiSummary({
  noteId,
  isPro,
}: {
  noteId: string;
  isPro: boolean;
}) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isPro) {
    return (
      <Link
        href="/premium"
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-accent/40 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent hover:text-primary-foreground"
      >
        ✨ AI Özet — Pro&apos;ya yükselt
      </Link>
    );
  }

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ noteId }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Özet oluşturulamadı.");
      else setSummary(data.summary);
    } catch {
      setError("Bağlantı hatası.");
    }
    setLoading(false);
  }

  return (
    <div className="mt-3">
      {!summary && (
        <button
          onClick={generate}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent hover:text-primary-foreground disabled:opacity-50"
        >
          {loading ? "Özetleniyor..." : "✨ AI Özet"}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      {summary && (
        <div className="mt-2 whitespace-pre-wrap rounded-lg border border-border bg-background/40 p-3 text-sm text-foreground">
          {summary}
        </div>
      )}
    </div>
  );
}
