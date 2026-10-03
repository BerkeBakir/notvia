"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  markAllRead,
  markRead,
  NOTIFICATION_ICONS,
  type NotificationItem,
} from "@/components/notifications/actions";

/** Çan + açılır son bildirimler; okundukça sayaç düşer. */
export function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(initialUnread);
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Sunucudan gelen sayı değişirse (sayfa geçişi) eşitle
  useEffect(() => setUnread(initialUnread), [initialUnread]);

  // Dışarı tıklayınca / Esc ile kapan
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next) {
      const { data } = await createClient()
        .from("notifications")
        .select("id,type,message,link,read,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(8);
      setItems(data ?? []);
    }
  }

  async function openItem(n: NotificationItem) {
    setOpen(false);
    if (!n.read) {
      setUnread((c) => Math.max(c - 1, 0));
      setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, read: true } : x)) ?? null);
      await markRead(n.id);
    }
    if (n.link) router.push(n.link);
    router.refresh();
  }

  async function readAll() {
    setUnread(0);
    setItems((list) => list?.map((x) => ({ ...x, read: true })) ?? null);
    await markAllRead(userId);
    router.refresh();
  }

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label="Bildirimler"
        className="relative text-lg"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-heading text-sm font-bold text-card-foreground">Bildirimler</span>
            <button
              type="button"
              onClick={readAll}
              disabled={unread === 0}
              className="text-xs text-primary hover:underline disabled:text-muted disabled:no-underline"
            >
              Tümünü okundu işaretle
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items === null ? (
              <p className="px-4 py-6 text-center text-sm text-muted">Yükleniyor...</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">Henüz bildirimin yok.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openItem(n)}
                  className={
                    "flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-primary/5 " +
                    (n.read ? "" : "bg-primary/5")
                  }
                >
                  <span>{NOTIFICATION_ICONS[n.type] ?? "🔔"}</span>
                  <span className="min-w-0 flex-1">
                    <span className={"block text-sm " + (n.read ? "text-muted" : "text-foreground")}>
                      {n.message}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-muted">
                      {new Date(n.created_at).toLocaleString("tr-TR")}
                    </span>
                  </span>
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              ))
            )}
          </div>
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-border px-4 py-2.5 text-center text-xs font-medium text-primary hover:bg-primary/5"
          >
            Tümünü gör
          </Link>
        </div>
      )}
    </div>
  );
}
