"use client";

import { useState } from "react";

export function UpgradeButton({ label }: { label: string }) {
  const [msg, setMsg] = useState("");

  return (
    <div>
      <button
        onClick={() =>
          setMsg("Bu bir demo sürümdür — ödeme sistemi yakında aktif olacak.")
        }
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        {label}
      </button>
      {msg && <p className="mt-2 text-center text-xs text-muted">{msg}</p>}
    </div>
  );
}
