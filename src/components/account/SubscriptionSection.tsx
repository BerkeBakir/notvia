"use client";

import { useState, useTransition } from "react";
import { Crown } from "@phosphor-icons/react";
import { cancelMySubscription, type ActionResult } from "@/lib/actions/payments";

export function SubscriptionSection({ plan, billing }: { plan: string; billing: string }) {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-card-foreground">
        <Crown size={20} weight="duotone" className="text-primary" /> Abonelik
      </h2>
      <p className="mt-1 text-sm text-muted">
        {plan === "pro" ? "Pro" : "Premium"} · {billing === "yearly" ? "yıllık" : "aylık"} · otomatik yenileniyor
      </p>
      {result ? (
        <p className={`mt-3 text-sm ${result.ok ? "text-primary" : "text-red-400"}`}>{result.message}</p>
      ) : confirming ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-foreground">Emin misin? Ücretli özellikler hemen kapanır.</span>
          <button
            disabled={pending}
            onClick={() => start(async () => setResult(await cancelMySubscription()))}
            className="rounded-full bg-red-500 px-4 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {pending ? "İptal ediliyor…" : "Evet, iptal et"}
          </button>
          <button onClick={() => setConfirming(false)} className="text-sm text-muted hover:text-foreground">
            Vazgeç
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="mt-3 rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-red-400 hover:text-red-400"
        >
          Aboneliği iptal et
        </button>
      )}
    </section>
  );
}
