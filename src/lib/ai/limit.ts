import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_DAILY_LIMIT = 5;
export const PREMIUM_DAILY_LIMIT = 50;

/** Plana göre günlük AI soru limiti. Pro = Infinity. */
export function dailyLimitFor(plan: string): number {
  if (plan === "pro") return Infinity;
  if (plan === "premium") return PREMIUM_DAILY_LIMIT;
  return FREE_DAILY_LIMIT;
}

/** Plana ve bugünkü kullanıma göre kalan soru hakkı. Pro = Infinity. */
export function remainingFor(plan: string, usedToday: number): number {
  const limit = dailyLimitFor(plan);
  if (limit === Infinity) return Infinity;
  return Math.max(0, limit - usedToday);
}

/**
 * Bir soru hakkı ATOMİK olarak tüketir (yarış-durumu önler).
 * consume_ai_quota RPC'si tek ifadeyle sayar; limit doluysa -1 döner.
 * Pro kullanıcılar sınırsızdır, sayaç işletilmez.
 */
export async function consumeDailyQuota(
  admin: SupabaseClient,
  userId: string,
  plan: string,
): Promise<{ allowed: boolean; remaining: number }> {
  if (plan === "pro") return { allowed: true, remaining: Infinity };

  const { data, error } = await admin.rpc("consume_ai_quota", {
    p_user: userId,
    p_limit: dailyLimitFor(plan),
  });
  if (error) throw new Error("Kota kontrolü başarısız: " + error.message);

  const remaining = typeof data === "number" ? data : -1;
  if (remaining < 0) return { allowed: false, remaining: 0 };
  return { allowed: true, remaining };
}

/** Başarısız istekte tüketilen hakkı geri verir (best-effort). */
export async function refundDailyQuota(
  admin: SupabaseClient,
  userId: string,
  plan: string,
): Promise<void> {
  if (plan === "pro") return;
  await admin.rpc("refund_ai_quota", { p_user: userId });
}

/** Salt-okunur: bugünkü kalan hak (gösterim için). Pro = Infinity. */
export async function remainingToday(
  admin: SupabaseClient,
  userId: string,
  plan: string,
): Promise<number> {
  if (plan === "pro") return Infinity;
  const { data } = await admin
    .from("ai_daily_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("day", new Date().toISOString().slice(0, 10))
    .maybeSingle();
  return remainingFor(plan, data?.count ?? 0);
}
