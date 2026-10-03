"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { computeRating } from "@/lib/rating";

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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={like}
        disabled={loading || isOwner}
        title={isOwner ? "Kendi notunu beğenemezsin" : undefined}
        className={
          liked
            ? "inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary disabled:opacity-50"
            : "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:text-primary disabled:opacity-50"
        }
      >
        <span>{liked ? "♥" : "♡"}</span>
        <span>{likes}</span>
      </button>

      <button
        onClick={dislike}
        disabled={loading || isOwner}
        title={isOwner ? "Kendi notuna oy veremezsin" : undefined}
        className={
          disliked
            ? "inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1.5 text-sm font-medium text-red-400 disabled:opacity-50"
            : "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:text-red-400 disabled:opacity-50"
        }
      >
        <span>👎</span>
        <span>{dislikes}</span>
      </button>

      {rating !== null && (
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-sm text-accent">
          ★ {rating.toFixed(1)}{" "}
          <span className="text-muted">/ 5</span>
        </span>
      )}
    </div>
  );
}
