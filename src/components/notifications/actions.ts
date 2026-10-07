"use client";

import { createClient } from "@/lib/supabase/client";

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export const NOTIFICATION_ICONS: Record<string, string> = {
  comment: "💬",
  like: "👍",
  note: "📄",
  follow: "🤝",
  friend_note: "👥",
  share: "📨",
  request: "🙋",
};

export async function markRead(id: string) {
  await createClient().from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllRead(userId: string) {
  await createClient()
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
}
