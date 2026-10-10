"use client";

import Link from "next/link";
import { Sparkle, X, Check } from "@phosphor-icons/react";

/**
 * Premium/Pro yükseltme penceresi (AI hakkı dolunca veya Pro'ya özel bir araca tıklanınca).
 * Fiyat göstermez: güncel fiyat ya da "yakında" bilgisi /premium sayfasındadır.
 */
export function AiUpsellModal({
  onClose,
  title = "Günlük soru hakkın doldu",
  description = "Daha fazla soru sormak için üyeliğini yükselt.",
}: {
  onClose: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Kapat"
          onClick={onClose}
          className="absolute right-4 top-4 text-muted hover:text-foreground"
        >
          <X size={20} />
        </button>
        <Sparkle size={32} weight="duotone" className="text-primary" />
        <h2 className="mt-3 font-heading text-xl font-bold text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{description}</p>

        <div className="mt-5 space-y-3">
          <div className="rounded-xl border border-border p-4">
            <span className="font-heading font-bold text-foreground">Premium</span>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Check size={14} weight="bold" className="text-primary" /> Günde 50 AI sorusu + reklamsız
            </p>
          </div>
          <div className="rounded-xl border-2 border-primary p-4">
            <span className="font-heading font-bold text-foreground">Pro</span>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <Check size={14} weight="bold" className="text-primary" /> Sınırsız AI + AI özet, soru üretici, flashcard
            </p>
          </div>
        </div>

        <Link
          href="/premium"
          className="mt-5 block w-full rounded-full bg-primary px-5 py-2.5 text-center text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Planları Gör
        </Link>
      </div>
    </div>
  );
}
