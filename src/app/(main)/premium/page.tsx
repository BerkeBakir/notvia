import { getCurrentUser } from "@/lib/supabase/auth";
import { PricingTiers } from "@/components/premium/PricingTiers";

export const metadata = {
  title: "Premium",
  description: "Notvia Premium ve Pro üyelik planları.",
};

export default async function PremiumPage() {
  const user = await getCurrentUser();
  return <PricingTiers currentPlan={user?.plan ?? "free"} />;
}
