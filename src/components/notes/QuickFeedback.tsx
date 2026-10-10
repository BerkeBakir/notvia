"use client";

import { useState } from "react";
import { toggleFeedback } from "@/lib/actions/votes";

const TAGS = [
  { key: "cok_iyi", label: "Çok iyi" },
  { key: "eksik", label: "Eksik" },
  { key: "okunaksiz", label: "Okunaksız" },
] as const;

/**
 * Tek tıkla kısa geri bildirim. Sahibi sayıları görür ama işaretleyemez.
 * Form eylemi: sayfa yüklenmeden tıklansa da kaydedilir; arayüz anında güncellenir.
 */
export function QuickFeedback({
  noteId,
  counts,
  mine,
  isOwner,
}: {
  noteId: string;
  counts: Record<string, number>;
  mine: string[];
  isOwner: boolean;
}) {
  const [c, setC] = useState(counts);
  const [m, setM] = useState(new Set(mine));

  function onToggle(tag: string) {
    const on = m.has(tag);
    const next = new Set(m);
    if (on) next.delete(tag);
    else next.add(tag);
    setM(next);
    setC((prev) => ({ ...prev, [tag]: Math.max((prev[tag] ?? 0) + (on ? -1 : 1), 0) }));
  }

  if (isOwner && !Object.values(c).some(Boolean)) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted">{isOwner ? "Öğrencilerin geri bildirimi:" : "Bu not nasıl?"}</span>
      {TAGS.map(({ key, label }) => {
        const active = m.has(key);
        const n = c[key] ?? 0;
        const cls = `rounded-full border px-3 py-1 text-xs transition ${
          active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-foreground"
        }`;
        if (isOwner) {
          return n ? (
            <span key={key} className={cls}>
              {label} · {n}
            </span>
          ) : null;
        }
        return (
          <form key={key} action={toggleFeedback.bind(null, noteId, key)} onSubmit={() => onToggle(key)} className="contents">
            <button type="submit" aria-pressed={active} className={cls}>
              {label}
              {n > 0 && ` · ${n}`}
            </button>
          </form>
        );
      })}
    </div>
  );
}
