// Ödeme yapılandırması. Ödeme, PAYMENTS_ENABLED=true ve iyzico anahtarları girilene kadar
// tamamen kapalıdır: /premium satın alma yerine ilgi anketi gösterir, ödeme rotaları 503 döner.

export type PaidPlan = "premium" | "pro";
export type Billing = "monthly" | "yearly";

/** Görüntülenen fiyatlar (TL). iyzico panelindeki fiyatlandırma planlarıyla aynı tutulmalı. */
// Yıllık = 10 aylık ücret (2 ay bedava).
export const PLAN_PRICES_TRY: Record<PaidPlan, Record<Billing, number>> = {
  premium: { monthly: 399.99, yearly: 3999.9 },
  pro: { monthly: 899.99, yearly: 8999.9 },
};

/** 399.99 → "399,99 ₺" (Türkçe biçim, her zaman iki ondalık). */
export function formatTry(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " ₺";
}

/** iyzico fiyatlandırma planı referans kodları (iyzico panelinde oluşturulur). */
export function pricingPlanRef(plan: PaidPlan, billing: Billing): string | undefined {
  const key = `IYZICO_PLAN_${plan.toUpperCase()}_${billing.toUpperCase()}`;
  return process.env[key] || undefined;
}

/** Referans koddan hangi plan olduğunu bul (webhook/geri dönüşte plan doğrulaması için). */
export function planForRef(ref: string | null | undefined): PaidPlan | null {
  if (!ref) return null;
  for (const plan of ["premium", "pro"] as const) {
    for (const billing of ["monthly", "yearly"] as const) {
      if (pricingPlanRef(plan, billing) === ref) return plan;
    }
  }
  return null;
}

export function iyzicoConfigured(): boolean {
  return !!(process.env.IYZICO_API_KEY && process.env.IYZICO_SECRET_KEY && process.env.IYZICO_BASE_URL);
}

/** Satın alma akışı açık mı? Bayrak + anahtarlar birlikte gerekir. */
export function paymentsEnabled(): boolean {
  return process.env.PAYMENTS_ENABLED === "true" && iyzicoConfigured();
}

export function isPaidPlan(v: unknown): v is PaidPlan {
  return v === "premium" || v === "pro";
}

export function isBilling(v: unknown): v is Billing {
  return v === "monthly" || v === "yearly";
}

/** iyzico abonelik durumlarından hangileri planı açık tutar. */
export function subscriptionGrantsAccess(status: string | null | undefined): boolean {
  return status === "ACTIVE" || status === "PENDING";
}
