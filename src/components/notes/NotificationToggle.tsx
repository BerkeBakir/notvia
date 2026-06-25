"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function NotificationToggle({
  courseId,
  userId,
  initialSubscribed,
}: {
  courseId: string;
  userId: string | null;
  initialSubscribed: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!userId) {
    return (
      <button
        onClick={() => router.push("/login")}
        className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:border-primary hover:text-primary"
      >
        🔔 Bildirim için giriş yap
      </button>
    );
  }

  async function toggle() {
    setLoading(true);
    setError("");
    if (subscribed) {
      const { error: delErr } = await supabase
        .from("course_subscriptions")
        .delete()
        .eq("user_id", userId)
        .eq("course_id", courseId);
      if (delErr) setError("Bildirim kapatılamadı. Tekrar dene.");
      else setSubscribed(false);
    } else {
      const { error: insErr } = await supabase
        .from("course_subscriptions")
        .insert({ user_id: userId, course_id: courseId });
      if (insErr) setError("Bildirim açılamadı. Tekrar dene.");
      else setSubscribed(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={loading}
        className={
          subscribed
            ? "rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            : "rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        }
      >
        {subscribed ? "🔔 Bildirimler açık" : "🔔 Bu ders için bildirim aç"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
