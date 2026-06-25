import { getCurrentUser } from "@/lib/supabase/auth";
import { UpgradeButton } from "@/components/premium/UpgradeButton";

const TIERS = [
  {
    name: "Ücretsiz",
    price: "₺0",
    period: "",
    plan: "free",
    highlight: false,
    features: [
      "Tüm notları tam PDF indir/görüntüle",
      "Üniversite, bölüm, ders ekleme",
      "Beğeni ve favori",
      "Aylık 10 yükleme / günlük 5 indirme",
    ],
  },
  {
    name: "Premium",
    price: "₺39",
    period: "/ay",
    plan: "premium",
    highlight: true,
    features: [
      "Ücretsizdeki her şey",
      "En çok beğenilen top 3 notun kilidi açık",
      "Reklamsız deneyim",
      "Sınırsız yükleme ve indirme",
      "Yeni notlara erken erişim",
    ],
  },
  {
    name: "Pro",
    price: "₺79",
    period: "/ay",
    plan: "pro",
    highlight: false,
    features: [
      "Premium'daki her şey",
      "AI not özeti",
      "AI soru üretici (nottan sınav sorusu)",
      "Akıllı etiketleme & benzer not önerisi",
      "Öncelikli destek + özel rozet",
    ],
  },
];

export default async function PremiumPage() {
  const user = await getCurrentUser();
  const currentPlan = user?.plan ?? "free";

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Planını Seç
        </h1>
        <p className="mt-2 text-muted">
          7 gün ücretsiz dene, istediğin zaman iptal et.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {TIERS.map((tier) => {
          const isCurrent = tier.plan === currentPlan;
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
              <h2 className="font-heading text-xl font-bold text-card-foreground">
                {tier.name}
              </h2>
              <p className="mt-2">
                <span className="text-3xl font-bold text-foreground">
                  {tier.price}
                </span>
                <span className="text-muted">{tier.period}</span>
              </p>

              <ul className="mt-5 space-y-2 text-sm text-muted">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-primary">✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent || tier.plan === "free" ? (
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
