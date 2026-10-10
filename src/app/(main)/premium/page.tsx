import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { paymentsEnabled } from "@/lib/payments/config";
import { PricingTiers } from "@/components/premium/PricingTiers";
import { PremiumInterest, type InterestAnswer } from "@/components/premium/PremiumInterest";

export const metadata = {
  title: "Premium",
  description: "Notvia Premium ve Pro üyelik planları.",
};

const PAYMENT_MESSAGES: Record<string, string> = {
  basarisiz: "Ödeme tamamlanamadı, kartından ücret alınmadı. Tekrar deneyebilirsin.",
  hata: "Ödeme oturumu bulunamadı. Tekrar dene.",
  kapali: "Ödeme sistemi şu an kapalı.",
};

export default async function PremiumPage({ searchParams }: { searchParams: Promise<{ odeme?: string }> }) {
  const user = await getCurrentUser();
  const enabled = paymentsEnabled();
  const msg = PAYMENT_MESSAGES[(await searchParams).odeme ?? ""];

  let interest: InterestAnswer | null = null;
  if (user && !enabled) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("premium_interest")
      .select("answer,plan,max_price,wants")
      .eq("user_id", user.id)
      .maybeSingle();
    interest = data;
  }

  return (
    <div className="space-y-10">
      {msg && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">{msg}</p>
      )}
      <PricingTiers currentPlan={user?.plan ?? "free"} enabled={enabled} />
      {!enabled && <PremiumInterest loggedIn={!!user} initial={interest} />}
    </div>
  );
}
