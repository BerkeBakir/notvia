"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, UserPlus, Users } from "@phosphor-icons/react";

/** Arkadaş ekle / çıkar (tek yönlü takip; karşılıklıysa "Arkadaşsınız"). */
export function FollowButton({
  targetId,
  viewerId,
  initialFollowing,
  followsYou = false,
  size = "md",
}: {
  targetId: string;
  viewerId: string | null;
  initialFollowing: boolean;
  followsYou?: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const supabase = createClient();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);

  if (viewerId === targetId) return null;

  async function toggle() {
    if (!viewerId) return router.push("/login");
    setBusy(true);
    if (following) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("follower_id", viewerId)
        .eq("following_id", targetId);
      if (!error) setFollowing(false);
    } else {
      const { error } = await supabase
        .from("follows")
        .insert({ follower_id: viewerId, following_id: targetId });
      if (!error || error.code === "23505") setFollowing(true);
    }
    setBusy(false);
    router.refresh();
  }

  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";
  const mutual = following && followsYou;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full font-medium transition disabled:opacity-60 ${pad} ${
        following
          ? hover
            ? "border border-red-500/40 bg-red-500/10 text-red-400"
            : "border border-primary/40 bg-primary/10 text-primary"
          : "bg-primary text-primary-foreground hover:opacity-90"
      }`}
    >
      {following ? (
        hover ? (
          "Çıkar"
        ) : (
          <>
            {mutual ? <Users size={16} weight="fill" /> : <Check size={16} weight="bold" />}
            {mutual ? "Arkadaşsınız" : "Eklendi"}
          </>
        )
      ) : (
        <>
          <UserPlus size={16} weight="bold" /> {followsYou ? "Sen de ekle" : "Arkadaş ekle"}
        </>
      )}
    </button>
  );
}
