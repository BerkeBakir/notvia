// src/components/ai/FloatingAssistant.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkle, X, PaperPlaneRight } from "@phosphor-icons/react";
import { useChatStream } from "@/components/ai/useChatStream";
import { ChatMessages } from "@/components/ai/ChatMessages";
import { AiUpsellModal } from "@/components/ai/AiUpsellModal";

/** Her sayfada sağ altta açılan sohbet balonu (platform geneli hızlı asistan). */
export function FloatingAssistant({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, loading, notice, showUpsell, setShowUpsell, send } = useChatStream();

  // Kendi asistanı olan sayfalarda gizle: /asistan ve ders çalışma alanı /courses/<id>
  const onDedicatedPage =
    pathname === "/asistan" ||
    (/^\/courses\/[^/]+$/.test(pathname) && pathname !== "/courses/new");
  if (onDedicatedPage) return null;

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Çalışma arkadaşını aç"
          className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90"
        >
          <Sparkle size={26} weight="duotone" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-40 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkle size={20} weight="duotone" className="text-primary" />
              <span className="font-heading font-bold text-foreground">Çalışma Arkadaşı</span>
            </div>
            <button type="button" aria-label="Kapat" onClick={() => setOpen(false)} className="text-muted hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          {!loggedIn ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-muted">Soru sormak için giriş yap.</p>
              <Link
                href="/login"
                className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Giriş yap
              </Link>
            </div>
          ) : (
            <>
              <ChatMessages
                messages={messages}
                loading={loading}
                className="flex-1 p-4"
                bubbleClassName="bg-background"
                empty={
                  <p className="py-8 text-center text-sm text-muted">
                    Platformdaki notlara dayanarak sorularını yanıtlar. Bir şey sor.
                  </p>
                }
              />

              {notice && <p className="px-4 pb-1 text-center text-[11px] text-muted">{notice}</p>}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const msg = input;
                  setInput("");
                  send(msg, { type: "all" });
                }}
                className="flex gap-2 border-t border-border p-3"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Soru sor..."
                  className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={loading}
                  aria-label="Gönder"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <PaperPlaneRight size={16} weight="fill" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {showUpsell && <AiUpsellModal onClose={() => setShowUpsell(false)} />}
    </>
  );
}
