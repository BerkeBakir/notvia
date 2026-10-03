import type { SupabaseClient } from "@supabase/supabase-js";

export const FREE_DAILY_LIMIT = 5;

/** Plana ve bugünkü kullanıma göre kalan soru hakkı. Pro = Infinity. */
export function remainingFor(plan: string, usedToday: number): number {
  if (plan === "pro") return Infinity;
  return Math.max(0, FREE_DAILY_LIMIT - usedToday);
}

/** Kullanıcının bugünkü soru sayısını sayar ve izin durumunu döndürür. */
export async function checkDailyLimit(
  admin: SupabaseClient,
  userId: string,
  plan: string,
): Promise<{ allowed: boolean; remaining: number }> {
  if (plan === "pro") return { allowed: true, remaining: Infinity };

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const { count } = await admin
    .from("ai_messages")
    .select("id, ai_conversations!inner(user_id)", { count: "exact", head: true })
    .eq("role", "user")
    .eq("ai_conversations.user_id", userId)
    .gte("created_at", since.toISOString());

  const remaining = remainingFor(plan, count ?? 0);
  return { allowed: remaining > 0, remaining };
}
