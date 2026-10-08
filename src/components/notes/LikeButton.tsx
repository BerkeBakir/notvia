"use client";

import { useState } from "react";
import { ThumbsUp } from "@phosphor-icons/react";
import { toggleLike } from "@/lib/actions/votes";

export function LikeButton({
  noteId,
  initialLiked,
  initialCount,
  isOwner = false,
}: {
  noteId: string;
  userId?: string | null;
  initialLiked: boolean;
  initialCount: number;
  /** Kendi notu: beğenemez (sunucuda da engelli). */
  isOwner?: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pop, setPop] = useState(false);

  function onSubmit() {
    if (liked) {
      setLiked(false);
      setCount((c) => Math.max(c - 1, 0));
    } else {
      setLiked(true);
      setPop(true);
      setCount((c) => c + 1);
    }
  }

  return (
    <form action={toggleLike.bind(null, noteId)} onSubmit={onSubmit} className="contents">
    <button
      type="submit"
      disabled={isOwner}
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
    </form>
  );
}
