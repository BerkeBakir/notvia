"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function FavoriteButton({
  noteId,
  userId,
  initialSaved,
}: {
  noteId: string;
  userId: string | null;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!userId) {
      router.push("/login");
      return;
    }
    setLoading(true);
    if (saved) {
      const { error } = await supabase
        .from("saves")
        .delete()
        .eq("user_id", userId)
        .eq("note_id", noteId);
      if (!error) setSaved(false);
    } else {
      const { error } = await supabase
        .from("saves")
        .insert({ user_id: userId, note_id: noteId });
      if (!error) setSaved(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      aria-pressed={saved}
      className={
        saved
          ? "inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent disabled:opacity-50"
          : "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:text-accent disabled:opacity-50"
      }
    >
      <span>{saved ? "★" : "☆"}</span>
      <span>{saved ? "Kaydedildi" : "Kaydet"}</span>
    </button>
  );
}
