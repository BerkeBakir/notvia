"use client";

import { useState } from "react";
import { BookmarkSimple } from "@phosphor-icons/react";
import { toggleSave } from "@/lib/actions/votes";

/** Kaydet: form eylemi — sayfa yüklenmeden tıklansa da çalışır; arayüz anında güncellenir. */
export function FavoriteButton({
  noteId,
  initialSaved,
}: {
  noteId: string;
  userId?: string | null;
  initialSaved: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);

  return (
    <form action={toggleSave.bind(null, noteId)} onSubmit={() => setSaved((s) => !s)} className="contents">
      <button
        type="submit"
        aria-pressed={saved}
        className={
          saved
            ? "inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3.5 py-2 text-sm font-medium text-accent transition disabled:opacity-50"
            : "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
        }
      >
        <BookmarkSimple size={18} weight={saved ? "fill" : "regular"} />
        <span>{saved ? "Kaydedildi" : "Kaydet"}</span>
      </button>
    </form>
  );
}
