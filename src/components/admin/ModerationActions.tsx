"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ModerationActions({
  noteId,
  reportId,
}: {
  noteId: string | null;
  reportId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");

  async function act(action: "deleteNote" | "dismissReport") {
    setLoading(action);
    await fetch("/api/admin/moderate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, noteId, reportId }),
    });
    setLoading("");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      {noteId && (
        <button
          onClick={() => act("deleteNote")}
          disabled={!!loading}
          className="rounded-lg bg-red-500/15 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500 hover:text-white disabled:opacity-50"
        >
          {loading === "deleteNote" ? "Siliniyor..." : "Notu Sil"}
        </button>
      )}
      <button
        onClick={() => act("dismissReport")}
        disabled={!!loading}
        className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted hover:text-foreground disabled:opacity-50"
      >
        {loading === "dismissReport" ? "..." : "Şikayeti Kapat"}
      </button>
    </div>
  );
}
