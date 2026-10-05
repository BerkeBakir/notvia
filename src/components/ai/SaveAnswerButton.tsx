"use client";

import { useState } from "react";
import { BookmarkSimple, Check } from "@phosphor-icons/react";
import { saveAnswer } from "@/lib/actions/savedAnswers";

/** Asistan cevabını kişisel "Kaydedilenler"e ekler. */
export function SaveAnswerButton({
  content,
  sources,
}: {
  content: string;
  sources?: { noteId: string }[];
}) {
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!content.trim()) return null;

  return (
    <button
      type="button"
      disabled={busy || saved}
      onClick={async () => {
        setBusy(true);
        const r = await saveAnswer(content, sources);
        setBusy(false);
        if (r.ok) setSaved(true);
      }}
      className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-primary disabled:opacity-60"
      title="Cevabı kaydet"
    >
      {saved ? (
        <>
          <Check size={12} /> Kaydedildi
        </>
      ) : (
        <>
          <BookmarkSimple size={12} /> {busy ? "..." : "Kaydet"}
        </>
      )}
    </button>
  );
}
