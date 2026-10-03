"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "@phosphor-icons/react";
import { AiPanel } from "@/components/ai/AiPanel";
import { Markdown } from "@/components/ai/Markdown";

export function AiSummary({
  noteId,
  isPro,
  title,
}: {
  noteId: string;
  isPro: boolean;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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

  function openPanel() {
    setOpen(true);
    // Özet bir kez üretilir; panel tekrar açılınca yeniden istek atılmaz
    if (!summary && !loading) void generate();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // pano izni yoksa sessizce geç
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-accent/40 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent hover:text-primary-foreground"
      >
        ✨ AI Özet
      </button>

      {open && (
        <AiPanel
          title="AI Özet"
          subtitle={title}
          onClose={() => setOpen(false)}
          footer={
            summary ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] text-muted">AI hata yapabilir; önemli bilgileri nottan doğrula.</p>
                <button
                  type="button"
                  onClick={copy}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Kopyalandı" : "Kopyala"}
                </button>
              </div>
            ) : undefined
          }
        >
          {loading && (
            <div className="space-y-3" aria-live="polite">
              <p className="animate-pulse text-sm text-muted">
                Not okunuyor ve özetleniyor... Büyük PDF&apos;lerde bu 30 saniyeyi bulabilir.
              </p>
              {[90, 75, 85, 60, 80, 70].map((w, i) => (
                <div key={i} className="h-3 animate-pulse rounded bg-foreground/10" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-sm">
              <p className="text-red-400">{error}</p>
              <button
                type="button"
                onClick={generate}
                className="mt-3 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
              >
                Tekrar dene
              </button>
            </div>
          )}
          {!loading && summary && <Markdown text={summary} />}
        </AiPanel>
      )}
    </>
  );
}
