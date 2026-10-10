import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { isBilling, isPaidPlan, paymentsEnabled, PLAN_PRICES_TRY } from "@/lib/payments/config";
import { CheckoutForm } from "@/components/premium/CheckoutForm";

export const metadata = { title: "Ödeme", robots: { index: false } };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; billing?: string }>;
}) {
  if (!paymentsEnabled()) redirect("/premium");
  const { plan, billing } = await searchParams;
  if (!isPaidPlan(plan) || !isBilling(billing)) redirect("/premium");
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/premium/odeme?plan=${plan}&billing=${billing}`)}`);
  if (user.plan === plan) redirect("/premium");

  const [first, ...rest] = user.name.trim().split(/\s+/);
  return (
    <CheckoutForm
      plan={plan}
      billing={billing}
      price={PLAN_PRICES_TRY[plan][billing]}
      defaultName={rest.length ? first : user.name}
      defaultSurname={rest.join(" ")}
    />
  );
}
