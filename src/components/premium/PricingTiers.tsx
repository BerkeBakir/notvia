"use client";

import { useState } from "react";
import { Check } from "@phosphor-icons/react";
import { UpgradeButton } from "@/components/premium/UpgradeButton";

type Billing = "monthly" | "yearly";

interface Tier {
  name: string;
  plan: string;
  monthly: number; // USD/ay
  highlight: boolean;
  features: string[];
}

const TIERS: Tier[] = [
  {
    name: "Ücretsiz",
    plan: "free",
    monthly: 0,
    highlight: false,
    features: [
      "Tüm notları tam PDF indir/görüntüle",
      "Üniversite, bölüm, ders ekleme",
      "Beğeni ve favori",
      "Aylık 10 yükleme / günlük 5 indirme",
      "Günde 5 AI çalışma arkadaşı sorusu",
    ],
  },
  {
    name: "Premium",
    plan: "premium",
    monthly: 5,
    highlight: true,
    features: [
      "Ücretsizdeki her şey",
      "Reklamsız deneyim",
      "En çok beğenilen top 3 notun kilidi açık",
      "Sınırsız yükleme ve indirme",
      "Günde 50 AI sorusu",
      "Yeni notlara erken erişim",
    ],
  },
  {
    name: "Pro",
    plan: "pro",
    monthly: 12,
    highlight: false,
    features: [
      "Premium'daki her şey",
      "Sınırsız AI çalışma arkadaşı",
      "AI not özeti",
      "AI soru üretici & flashcard",
      "Akıllı etiketleme & benzer not önerisi",
      "Öncelikli destek + özel rozet",
    ],
  },
];

// Yıllık = 10 ay fiyatına (2 ay bedava)
const YEARLY_MONTHS = 10;

export function PricingTiers({ currentPlan }: { currentPlan: string }) {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">Planını Seç</h1>
        <p className="mt-2 text-muted">7 gün ücretsiz dene, istediğin zaman iptal et.</p>
      </div>

      {/* Aylık / Yıllık geçişi */}
      <div className="flex items-center justify-center gap-2">
        <div className="inline-flex rounded-full border border-border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setBilling("monthly")}
            className={
              billing === "monthly"
                ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-full px-4 py-1.5 text-sm text-muted hover:text-foreground"
            }
          >
            Aylık
          </button>
          <button
            type="button"
            onClick={() => setBilling("yearly")}
            className={
              billing === "yearly"
                ? "rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-full px-4 py-1.5 text-sm text-muted hover:text-foreground"
            }
          >
            Yıllık
          </button>
        </div>
        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
          2 ay bedava
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TIERS.map((tier) => {
          const isCurrent = tier.plan === currentPlan;
          const isFree = tier.plan === "free";
          const priceNum =
            billing === "yearly" ? tier.monthly * YEARLY_MONTHS : tier.monthly;
          const period = isFree ? "" : billing === "yearly" ? " / yıl" : " / ay";

          return (
            <div
              key={tier.plan}
              className={
                tier.highlight
                  ? "relative rounded-2xl border-2 border-primary bg-card p-6"
                  : "rounded-2xl border border-border bg-card p-6"
              }
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  En popüler
                </span>
              )}
              <h2 className="font-heading text-xl font-bold text-card-foreground">{tier.name}</h2>
              <p className="mt-2">
                <span className="text-3xl font-bold text-foreground">${priceNum}</span>
                <span className="text-muted">{period}</span>
              </p>
              {!isFree && billing === "yearly" && (
                <p className="mt-1 text-xs text-muted">
                  Ayda ${(tier.monthly * YEARLY_MONTHS / 12).toFixed(2)} (12 ay yerine {YEARLY_MONTHS} ay öde)
                </p>
              )}

              <ul className="mt-5 space-y-2 text-sm text-muted">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent || isFree ? (
                  <button
                    disabled
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted"
                  >
                    {isCurrent ? "Mevcut planın" : "Ücretsiz"}
                  </button>
                ) : (
                  <UpgradeButton label={`${tier.name}'a Geç`} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted">
        Ödeme entegrasyonu (İyzico / Stripe) yakında eklenecek.
      </p>
    </div>
  );
}
