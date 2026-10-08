"use client";

import { useState } from "react";
import { referralCode } from "@/lib/referralCode";

export function InviteLink({ userId }: { userId: string }) {
  const [copied, setCopied] = useState<"" | "link" | "code">("");
  const code = referralCode(userId);

  function copy(kind: "link" | "code") {
    const text = kind === "link" ? `${window.location.origin}/?ref=${userId}` : code;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(""), 2000);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => copy("link")}
        className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
      >
        {copied === "link" ? "✓ Kopyalandı" : "🔗 Davet linkini kopyala"}
      </button>
      <button
        type="button"
        onClick={() => copy("code")}
        title="Arkadaşın kaydolurken bu kodu yazabilir"
        className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:border-primary"
      >
        <span className="text-xs text-muted">Davet kodun</span>
        <span className="font-mono font-semibold tracking-wider">{code}</span>
        <span className="text-xs text-primary">{copied === "code" ? "✓" : "Kopyala"}</span>
      </button>
    </div>
  );
}
