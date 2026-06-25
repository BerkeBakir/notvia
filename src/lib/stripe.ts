import Stripe from "stripe";

/** Stripe istemcisi (STRIPE_SECRET_KEY yoksa null — ödeme henüz aktif değil). */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function priceIdFor(plan: string): string | undefined {
  if (plan === "pro") return process.env.STRIPE_PRICE_PRO;
  if (plan === "premium") return process.env.STRIPE_PRICE_PREMIUM;
  return undefined;
}
