"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LikeButton({
  noteId,
  userId,
  initialLiked,
  initialCount,
  isOwner = false,
}: {
  noteId: string;
  userId: string | null;
  initialLiked: boolean;
  initialCount: number;
  /** Kendi notu: beğenemez (DB'de de RLS ile engelli). */
  isOwner?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!userId) {
      router.push("/login");
      return;
    }
    setLoading(true);

    if (liked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq("note_id", noteId);
      if (!error) {
        setLiked(false);
        setCount((c) => Math.max(c - 1, 0));
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: userId, note_id: noteId });
      if (!error) {
        setLiked(true);
        setCount((c) => c + 1);
      }
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading || isOwner}
      title={isOwner ? "Kendi notunu beğenemezsin" : undefined}
      aria-pressed={liked}
      className={
        liked
          ? "inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary disabled:opacity-50"
          : "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:text-primary disabled:opacity-50"
      }
    >
      <span>{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}
