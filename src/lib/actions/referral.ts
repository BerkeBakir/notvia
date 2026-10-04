"use server";

import { getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const REFERRAL_REWARD_REQUIRED = 5;
const REWARD_DAYS = 30;

/**
 * Kullanıcının davet sayısını kontrol eder; eşik dolduysa 1 ay Premium verir.
 * Tek seferlik (referral_reward_granted). Zaten ücretli plandaysa planı değiştirmez.
 */
export async function checkReferralReward(): Promise<{
  count: number;
  required: number;
  granted: boolean;
}> {
  const user = await getCurrentUser();
  const admin = createAdminClient();
  if (!user || !admin) {
    return { count: 0, required: REFERRAL_REWARD_REQUIRED, granted: false };
  }

  const { count } = await admin
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id);
  const referralCount = count ?? 0;

  const { data: row } = await admin
    .from("users")
    .select("plan, referral_reward_granted")
    .eq("id", user.id)
    .maybeSingle();
  let granted = row?.referral_reward_granted ?? false;

  if (!granted && referralCount >= REFERRAL_REWARD_REQUIRED) {
    const until = new Date(Date.now() + REWARD_DAYS * 86400000).toISOString();
    const update: Record<string, unknown> = { referral_reward_granted: true };
    // Yalnızca ücretsiz kullanıcıya plan ver; zaten Premium/Pro ise dokunma
    if ((row?.plan ?? "free") === "free") {
      update.plan = "premium";
      update.premium_until = until;
    }
    await admin.from("users").update(update).eq("id", user.id);
    granted = true;
  }

  return { count: referralCount, required: REFERRAL_REWARD_REQUIRED, granted };
}
