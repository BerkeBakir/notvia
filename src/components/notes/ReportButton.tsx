"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REASONS = [
  "Telif hakkı ihlali",
  "Uygunsuz / spam içerik",
  "Yanlış derse yüklenmiş",
  "Diğer",
];

export function ReportButton({
  noteId,
  userId,
}: {
  noteId: string;
  userId: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<"" | "ok" | "again">("");
  const [loading, setLoading] = useState(false);

  async function report(reason: string) {
    if (!userId) return router.push("/login");
    setLoading(true);
    const { error } = await supabase.from("reports").insert({
      note_id: noteId,
      user_id: userId,
      reason,
    });
    // 23505: aynı kişi aynı notu daha önce şikayet etmiş
    setDone(error?.code === "23505" ? "again" : "ok");
    setOpen(false);
    setLoading(false);
  }

  if (done) {
    return (
      <span className="text-xs text-muted">
        {done === "again"
          ? "Bu notu zaten şikayet etmiştin; inceleniyor."
          : "Şikayetin alındı, teşekkürler. İncelendiğinde bildirim alacaksın."}
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-muted hover:text-red-400"
      >
        ⚑ Şikayet et
      </button>
      {open && (
        <div className="absolute z-10 mt-2 w-52 rounded-lg border border-border bg-card p-2 shadow-lg">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => report(r)}
              disabled={loading}
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-primary/10 disabled:opacity-50"
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
