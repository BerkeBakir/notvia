"use client";

import { useState } from "react";

const OPTS = [
  ["yeni", "Yeni"],
  ["okundu", "Okundu"],
  ["cozuldu", "Çözüldü"],
] as const;

export function FeedbackStatus({ id, status }: { id: string; status: string }) {
  const [cur, setCur] = useState(status);
  const [busy, setBusy] = useState(false);

  async function set(s: string) {
    if (s === cur || busy) return;
    setBusy(true);
    const res = await fetch("/api/admin/moderate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "feedbackStatus", feedbackId: id, status: s }),
    });
    if (res.ok) setCur(s);
    setBusy(false);
  }

  return (
    <div className="flex rounded-full border border-border p-0.5 text-xs">
      {OPTS.map(([v, l]) => (
        <button
          key={v}
          type="button"
          disabled={busy}
          onClick={() => set(v)}
          className={`rounded-full px-2.5 py-1 transition ${cur === v ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
