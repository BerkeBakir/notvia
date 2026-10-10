import type { SupabaseClient } from "@supabase/supabase-js";
import { planForRef, subscriptionGrantsAccess } from "./config";
import type { SubscriptionData } from "./iyzico";

/**
 * iyzico'dan doğrulanan abonelik durumunu veritabanına yansıtır: abonelik satırı + kullanıcı planı.
 * Plan, istemciden gelen değere değil iyzico'daki fiyatlandırma planı koduna göre belirlenir.
 */
export async function applySubscription(admin: SupabaseClient, rowId: string, userId: string, data: SubscriptionData) {
  const plan = planForRef(data.pricingPlanReferenceCode);
  await admin
    .from("payment_subscriptions")
    .update({ reference_code: data.referenceCode, status: data.subscriptionStatus, updated_at: new Date().toISOString() })
    .eq("id", rowId);

  if (plan && subscriptionGrantsAccess(data.subscriptionStatus)) {
    await admin.from("users").update({ plan, premium_until: null }).eq("id", userId);
    return plan;
  }

  // Erişim bitti: yalnızca süresiz (ödemeyle gelmiş) planı düşür; davet ödülü gibi süreli planlara dokunma.
  await admin.from("users").update({ plan: "free" }).eq("id", userId).is("premium_until", null).neq("plan", "free");
  return null;
}
