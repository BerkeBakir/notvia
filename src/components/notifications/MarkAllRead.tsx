"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function MarkAllRead({ userId }: { userId: string }) {
  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
  }, [userId]);

  return null;
}
