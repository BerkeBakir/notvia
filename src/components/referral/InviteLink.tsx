"use client";

import { useState } from "react";

export function InviteLink({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    const url = `${window.location.origin}/?ref=${userId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={copy}
      className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
    >
      {copied ? "✓ Kopyalandı" : "🔗 Davet linkini kopyala"}
    </button>
  );
}
