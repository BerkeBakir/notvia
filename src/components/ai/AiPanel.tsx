// src/components/ai/AiPanel.tsx
"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Sparkle, X } from "@phosphor-icons/react";

/**
 * Yüzen AI paneli: masaüstünde sağdan çekmece, mobilde alttan sayfa.
 * Esc / arka plana tıklama ile kapanır; açıkken sayfa kaymaz.
 */
export function AiPanel({
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="animate-panel-in absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl border border-border bg-card shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[460px] sm:rounded-none sm:rounded-l-3xl">
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkle size={20} weight="duotone" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-heading text-base font-bold text-card-foreground">{title}</h2>
            {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-foreground/5 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4 text-sm text-foreground">{children}</div>
        {footer && <footer className="border-t border-border px-5 py-3">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
}
