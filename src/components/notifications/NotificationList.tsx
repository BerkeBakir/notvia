"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  markAllRead,
  markRead,
  NOTIFICATION_ICONS,
  type NotificationItem,
} from "@/components/notifications/actions";

export function NotificationList({ userId, initial }: { userId: string; initial: NotificationItem[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const unread = list.filter((n) => !n.read).length;

  async function openItem(n: NotificationItem) {
    if (!n.read) {
      setList((l) => l.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await markRead(n.id);
    }
    if (n.link) router.push(n.link);
    router.refresh();
  }

  async function readAll() {
    setList((l) => l.map((x) => ({ ...x, read: true })));
    await markAllRead(userId);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{unread > 0 ? `${unread} okunmamış` : "Hepsi okundu"}</p>
        <button
          type="button"
          onClick={readAll}
          disabled={unread === 0}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary hover:text-primary disabled:opacity-50"
        >
          Tümünü okundu işaretle
        </button>
      </div>
      <ul className="space-y-2">
        {list.map((n) => (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => openItem(n)}
              className={
                n.read
                  ? "flex w-full items-start gap-3 rounded-xl border border-border bg-card p-4 text-left"
                  : "flex w-full items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 text-left"
              }
            >
              <span className="text-lg">{NOTIFICATION_ICONS[n.type] ?? "🔔"}</span>
              <div className="flex-1">
                <p className="text-sm text-foreground">{n.message}</p>
                <p className="mt-1 text-xs text-muted">{new Date(n.created_at).toLocaleString("tr-TR")}</p>
              </div>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
