"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, ArrowCounterClockwise } from "@phosphor-icons/react";
import type { Flashcard } from "@/lib/ai/studio";

/** Bilgi kartları: tıkla-çevir, "Biliyorum / Tekrar" ile işaretle, sonda tekrar edilecekleri çalış. */
export function FlashcardView({ cards }: { cards: Flashcard[] }) {
  const [deck, setDeck] = useState(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const finished = pos >= deck.length;
  const card = cards[deck[pos]];

  function go(next: number) {
    setFlipped(false);
    setPos(Math.max(0, next));
  }

  function mark(isKnown: boolean) {
    const id = deck[pos];
    setKnown((s) => {
      const n = new Set(s);
      if (isKnown) n.add(id);
      else n.delete(id);
      return n;
    });
    go(pos + 1);
  }

  function restart(onlyUnknown: boolean) {
    const ids = cards.map((_, i) => i).filter((i) => !onlyUnknown || !known.has(i));
    setDeck(ids.length ? ids : cards.map((_, i) => i));
    go(0);
  }

  if (finished) {
    const unknown = cards.length - known.size;
    return (
      <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6 text-center">
        <p className="font-heading text-2xl font-bold text-primary">
          {known.size}/{cards.length}
        </p>
        <p className="mt-1 text-sm text-muted">kartı biliyorsun.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {unknown > 0 && (
            <button
              type="button"
              onClick={() => restart(true)}
              className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              Tekrar edilecek {unknown} kartı çalış
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setKnown(new Set());
              restart(false);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
          >
            <ArrowCounterClockwise size={14} /> Baştan başla
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Kart {pos + 1}/{deck.length}
        </span>
        <span>Bilinen: {known.size}</span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="block h-56 w-full [perspective:1000px]"
        aria-label={flipped ? "Ön yüzü göster" : "Arka yüzü göster"}
      >
        <span
          className={`relative block h-full w-full transition-transform duration-500 [transform-style:preserve-3d] ${flipped ? "[transform:rotateY(180deg)]" : ""}`}
        >
          <span className="absolute inset-0 grid place-items-center rounded-2xl border border-border bg-background p-6 text-center [backface-visibility:hidden]">
            <span>
              <span className="block font-heading text-lg font-bold text-foreground">{card.front}</span>
              <span className="mt-3 block text-[11px] text-muted">Çevirmek için tıkla</span>
            </span>
          </span>
          <span className="absolute inset-0 grid place-items-center overflow-y-auto rounded-2xl border border-primary/40 bg-primary/5 p-6 text-center text-sm leading-relaxed text-foreground [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {card.back}
          </span>
        </span>
      </button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => go(pos - 1)}
          disabled={pos === 0}
          aria-label="Önceki"
          className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted hover:text-foreground disabled:opacity-40"
        >
          <ArrowLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => mark(false)}
          className="flex-1 rounded-full border border-red-400/40 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-400/10"
        >
          Tekrar et
        </button>
        <button
          type="button"
          onClick={() => mark(true)}
          className="flex-1 rounded-full border border-emerald-500/40 px-3 py-2 text-xs font-medium text-emerald-500 hover:bg-emerald-500/10"
        >
          Biliyorum
        </button>
        <button
          type="button"
          onClick={() => go(pos + 1)}
          aria-label="Sonraki"
          className="grid h-9 w-9 place-items-center rounded-full border border-border text-muted hover:text-foreground"
        >
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
