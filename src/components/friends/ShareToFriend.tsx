"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Check, PaperPlaneTilt, X } from "@phosphor-icons/react";
import { matchScore } from "@/lib/textMatch";

type Friend = { id: string; name: string };

/** Notu ya da kayıtlı AI cevabını arkadaşına gönder. */
export function ShareToFriend({
  userId,
  noteId,
  answerId,
  compact = false,
}: {
  userId: string | null;
  noteId?: string;
  answerId?: string;
  compact?: boolean;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (!userId) return null;

  async function openModal() {
    setOpen(true);
    setError("");
    if (friends) return;
    const { data: rows } = await supabase.from("follows").select("following_id").eq("follower_id", userId!);
    const ids = (rows ?? []).map((r) => r.following_id);
    if (!ids.length) return setFriends([]);
    const { data: users } = await supabase.from("users").select("id,name").in("id", ids);
    setFriends(((users ?? []) as Friend[]).sort((a, b) => a.name.localeCompare(b.name, "tr")));
  }

  async function send(to: string) {
    setBusy(to);
    setError("");
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ to, noteId, answerId, message }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setSent((s) => new Set(s).add(to));
    else setError(data.error ?? "Gönderilemedi.");
    setBusy(null);
  }

  const list = (friends ?? []).filter((f) => matchScore(f.name, q) > 0);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className={
          compact
            ? "inline-flex items-center gap-1 text-xs text-muted transition hover:text-primary"
            : "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-muted transition hover:border-primary/40 hover:text-primary"
        }
      >
        <PaperPlaneTilt size={compact ? 14 : 18} /> {compact ? "Gönder" : "Arkadaşına gönder"}
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="animate-fade-up relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <span className="font-heading font-bold text-foreground">
                  {answerId ? "Cevabı arkadaşına gönder" : "Notu arkadaşına gönder"}
                </span>
                <button type="button" aria-label="Kapat" onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-3 p-4">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={140}
                  placeholder="Kısa bir not ekle (opsiyonel)"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
                />
                {friends && friends.length > 5 && (
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Arkadaş ara..."
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
                  />
                )}
                {error && <p className="text-xs text-red-400">{error}</p>}
                <ul className="max-h-64 space-y-1 overflow-y-auto">
                  {friends === null && <li className="py-6 text-center text-sm text-muted">Yükleniyor…</li>}
                  {friends?.length === 0 && (
                    <li className="py-6 text-center text-sm text-muted">
                      Henüz arkadaş eklemedin.{" "}
                      <Link href="/arkadaslar?tab=bul" className="text-primary hover:underline">
                        Arkadaş bul
                      </Link>
                    </li>
                  )}
                  {list.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-background/60">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {f.name.slice(0, 1).toLocaleUpperCase("tr")}
                        </span>
                        <span className="truncate text-sm text-foreground">{f.name}</span>
                      </span>
                      <button
                        type="button"
                        disabled={busy === f.id || sent.has(f.id)}
                        onClick={() => send(f.id)}
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                          sent.has(f.id) ? "bg-primary/15 text-primary" : "bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
                        }`}
                      >
                        {sent.has(f.id) ? (
                          <>
                            <Check size={12} weight="bold" /> Gönderildi
                          </>
                        ) : busy === f.id ? (
                          "…"
                        ) : (
                          "Gönder"
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
