"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkle, MagnifyingGlass, Buildings, FileText } from "@phosphor-icons/react";

interface Result {
  noteId: string;
  title: string;
  course: string;
  university: string;
  similarity: number;
}

/** Semantik konu arama: "bu konu nerede işleniyor" — anlam bazlı not bulur. */
export function TopicSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q || loading) return;
    setLoading(true);
    setNotice("");
    setResults(null);
    try {
      const res = await fetch("/api/ai/search-topic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok) setNotice(data.error ?? "Arama yapılamadı.");
      else setResults(data.results ?? []);
    } catch {
      setNotice("Bağlantı hatası.");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-primary/25 bg-card p-4">
      <div className="flex items-center gap-2">
        <Sparkle size={20} weight="duotone" className="text-primary" />
        <h2 className="font-heading font-bold text-card-foreground">Konu ara (AI)</h2>
      </div>
      <p className="mt-1 text-xs text-muted">
        Anlam bazlı arama — &quot;bu konu hangi notlarda işleniyor&quot;. Örn: &quot;Karnaugh haritası ile sadeleştirme&quot;.
      </p>

      <form onSubmit={run} className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Bir konu yaz..."
          className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading}
          aria-label="Ara"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <MagnifyingGlass size={18} weight="bold" />
        </button>
      </form>

      {loading && <p className="mt-3 animate-pulse text-sm text-muted">Notlar taranıyor...</p>}
      {notice && <p className="mt-3 text-sm text-muted">{notice}</p>}

      {results && !loading && (
        <div className="mt-3 space-y-1.5">
          {results.length === 0 ? (
            <p className="text-sm text-muted">Bu konuyla ilgili indekslenmiş not bulunamadı.</p>
          ) : (
            results.map((r) => (
              <Link
                key={r.noteId}
                href={`/notes/${r.noteId}`}
                className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm hover:border-primary"
              >
                <FileText size={16} className="mt-0.5 shrink-0 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{r.title}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                    <Buildings size={11} /> {r.university}
                    {r.course ? ` · ${r.course}` : ""}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
