"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThumbsUp } from "@phosphor-icons/react";

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
  const [pop, setPop] = useState(false);

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
        setPop(true);
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
          ? "inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3.5 py-2 text-sm font-medium text-primary transition disabled:opacity-60"
          : "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-muted transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
      }
    >
      <ThumbsUp
        size={18}
        weight={liked ? "fill" : "regular"}
        className={pop ? "vote-pop" : ""}
        onAnimationEnd={() => setPop(false)}
      />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
