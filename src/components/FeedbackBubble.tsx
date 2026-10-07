"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bug, ChatCircleDots, CheckCircle, Lightbulb, Question, X } from "@phosphor-icons/react";

const KINDS = [
  { v: "oneri", label: "Öneri", icon: Lightbulb, ph: "Notvia'da ne olsun istersin?" },
  { v: "soru", label: "Soru", icon: Question, ph: "Merak ettiğin ne?" },
  { v: "hata", label: "Hata", icon: Bug, ph: "Ne oldu, nerede? Ne bekliyordun?" },
] as const;

/** Sol altta sabit geri bildirim baloncuğu: öneri / soru / hata. */
export function FeedbackBubble({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<(typeof KINDS)[number]["v"]>("oneri");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState(""); // bal tuzağı
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, message, contact, page: pathname, website }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Gönderilemedi.");
      setDone(true);
      setMessage("");
      setContact("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

  const current = KINDS.find((k) => k.v === kind)!;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setDone(false);
          }}
          aria-label="Geri bildirim gönder"
          className="group fixed bottom-5 left-5 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-border bg-card/90 px-3.5 text-sm text-foreground shadow-lg backdrop-blur transition hover:border-primary hover:text-primary"
        >
          <ChatCircleDots size={20} weight="duotone" className="text-primary" />
          <span className="hidden sm:inline">Fikrin mi var?</span>
        </button>
      )}

      {open && (
        <div className="animate-fade-up fixed bottom-5 left-5 z-50 w-[22rem] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-heading font-bold text-foreground">Bize yaz 💬</span>
            <button type="button" aria-label="Kapat" onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
              <CheckCircle size={40} weight="duotone" className="text-primary" />
              <p className="font-medium text-foreground">Teşekkürler!</p>
              <p className="text-sm text-muted">Mesajın bize ulaştı. Her birini okuyoruz.</p>
              <button
                type="button"
                onClick={() => setDone(false)}
                className="mt-2 text-sm text-primary hover:underline"
              >
                Bir tane daha yaz
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3 p-4">
              <div className="grid grid-cols-3 gap-2">
                {KINDS.map((k) => (
                  <button
                    key={k.v}
                    type="button"
                    onClick={() => setKind(k.v)}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs transition ${
                      kind === k.v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    <k.icon size={20} weight={kind === k.v ? "fill" : "duotone"} />
                    {k.label}
                  </button>
                ))}
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={current.ph}
                rows={4}
                maxLength={2000}
                required
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary"
              />
              {!loggedIn && (
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  type="email"
                  placeholder="E-posta (cevap istersen, opsiyonel)"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary"
                />
              )}
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={sending || message.trim().length < 3}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {sending ? "Gönderiliyor..." : "Gönder"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
