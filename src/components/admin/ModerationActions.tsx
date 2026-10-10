"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Bir notun şikayetleri için moderatör kararı: kaldır (sebeple) veya geri aç / şikayetleri kapat. */
export function ModerationActions({
  noteId,
  hidden,
  defaultReason,
}: {
  noteId: string;
  hidden: boolean;
  defaultReason: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [reason, setReason] = useState(defaultReason);
  const [error, setError] = useState("");

  async function act(action: "removeNote" | "restoreNote") {
    setLoading(action);
    setError("");
    const res = await fetch("/api/admin/moderate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, noteId, reason }),
    });
    if (!res.ok) setError((await res.json().catch(() => null))?.error ?? "İşlem başarısız.");
    setLoading("");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:w-64">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Kaldırma sebebi (sahibine gider)"
        className="rounded-lg border border-border bg-background/40 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
      />
      <div className="flex gap-2">
        <button
          onClick={() => act("removeNote")}
          disabled={!!loading}
          className="flex-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-50"
        >
          {loading === "removeNote" ? "Kaldırılıyor…" : "Kaldır"}
        </button>
        <button
          onClick={() => act("restoreNote")}
          disabled={!!loading}
          className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-50"
        >
          {loading === "restoreNote" ? "…" : hidden ? "Geri aç" : "Şikayetleri kapat"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
