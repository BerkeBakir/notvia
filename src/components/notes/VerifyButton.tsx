"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const THRESHOLD = 3;

export function VerifyButton({
  courseId,
  userId,
  verified,
  initialVerifiedByMe,
  initialCount,
}: {
  courseId: string;
  userId: string | null;
  verified: boolean;
  initialVerifiedByMe: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [verifiedByMe, setVerifiedByMe] = useState(initialVerifiedByMe);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-3 py-1.5 text-sm font-medium text-primary">
        ✓ Doğrulanmış ders
      </span>
    );
  }

  async function toggle() {
    if (!userId) return router.push("/login");
    setLoading(true);
    if (verifiedByMe) {
      await supabase
        .from("course_verifications")
        .delete()
        .eq("user_id", userId)
        .eq("course_id", courseId);
      setVerifiedByMe(false);
      setCount((c) => Math.max(c - 1, 0));
    } else {
      await supabase
        .from("course_verifications")
        .insert({ user_id: userId, course_id: courseId });
      setVerifiedByMe(true);
      setCount((c) => c + 1);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={`${count}/${THRESHOLD} onay`}
      className={
        verifiedByMe
          ? "inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent disabled:opacity-50"
          : "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:text-accent disabled:opacity-50"
      }
    >
      ✓ Dersi doğrula ({count}/{THRESHOLD})
    </button>
  );
}
