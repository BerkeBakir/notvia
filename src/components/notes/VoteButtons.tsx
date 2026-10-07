"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { computeRating } from "@/lib/rating";
import { Star, ThumbsDown, ThumbsUp } from "@phosphor-icons/react";

export function VoteButtons({
  noteId,
  userId,
  initialLiked,
  initialDisliked,
  initialLikes,
  initialDislikes,
  isOwner = false,
}: {
  noteId: string;
  userId: string | null;
  initialLiked: boolean;
  initialDisliked: boolean;
  initialLikes: number;
  initialDislikes: number;
  /** Kendi notu: oy veremez (DB'de de RLS ile engelli). */
  isOwner?: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [liked, setLiked] = useState(initialLiked);
  const [disliked, setDisliked] = useState(initialDisliked);
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [loading, setLoading] = useState(false);
  const [pop, setPop] = useState<"up" | "down" | null>(null);

  async function like() {
    if (!userId) return router.push("/login");
    setLoading(true);
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", userId).eq("note_id", noteId);
      setLiked(false);
      setLikes((c) => Math.max(c - 1, 0));
    } else {
      await supabase.from("likes").insert({ user_id: userId, note_id: noteId });
      setLiked(true);
      setPop("up");
      setLikes((c) => c + 1);
      if (disliked) {
        await supabase.from("dislikes").delete().eq("user_id", userId).eq("note_id", noteId);
        setDisliked(false);
        setDislikes((c) => Math.max(c - 1, 0));
      }
    }
    setLoading(false);
  }

  async function dislike() {
    if (!userId) return router.push("/login");
    setLoading(true);
    if (disliked) {
      await supabase.from("dislikes").delete().eq("user_id", userId).eq("note_id", noteId);
      setDisliked(false);
      setDislikes((c) => Math.max(c - 1, 0));
    } else {
      await supabase.from("dislikes").insert({ user_id: userId, note_id: noteId });
      setDisliked(true);
      setPop("down");
      setDislikes((c) => c + 1);
      if (liked) {
        await supabase.from("likes").delete().eq("user_id", userId).eq("note_id", noteId);
        setLiked(false);
        setLikes((c) => Math.max(c - 1, 0));
      }
    }
    setLoading(false);
  }

  const rating = computeRating(likes, dislikes);

  const lockTitle = isOwner ? "Kendi notuna oy veremezsin" : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        className={`inline-flex items-stretch overflow-hidden rounded-full border border-border bg-card ${
          isOwner ? "opacity-60" : ""
        }`}
        title={lockTitle}
      >
        <button
          onClick={like}
          disabled={loading || isOwner}
          aria-pressed={liked}
          aria-label="Beğen"
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${
            liked ? "bg-primary/15 text-primary" : "text-muted hover:bg-primary/5 hover:text-primary"
          }`}
        >
          <ThumbsUp
            size={18}
            weight={liked ? "fill" : "regular"}
            className={pop === "up" ? "vote-pop" : ""}
            onAnimationEnd={() => setPop(null)}
          />
          <span className="tabular-nums">{likes}</span>
        </button>
        <span className="w-px bg-border" aria-hidden="true" />
        <button
          onClick={dislike}
          disabled={loading || isOwner}
          aria-pressed={disliked}
          aria-label="Beğenme"
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${
            disliked ? "bg-red-500/15 text-red-400" : "text-muted hover:bg-red-500/5 hover:text-red-400"
          }`}
        >
          <ThumbsDown
            size={18}
            weight={disliked ? "fill" : "regular"}
            className={pop === "down" ? "vote-pop" : ""}
            onAnimationEnd={() => setPop(null)}
          />
          <span className="tabular-nums">{dislikes}</span>
        </button>
      </div>

      {rating !== null && (
        <span
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-2 text-sm"
          title={`${likes + dislikes} oydan hesaplandı`}
        >
          <Star size={16} weight="fill" className="text-accent" />
          <span className="font-medium tabular-nums text-foreground">{rating.toFixed(1)}</span>
          <span className="text-muted">/ 5</span>
        </span>
      )}
    </div>
  );
}
