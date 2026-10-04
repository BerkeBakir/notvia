"use server";

import { getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Günlük çalışma serisini günceller (server-side, service_role ile güvenli).
 * Bugün zaten sayıldıysa yazmaz. Dün aktifse +1, değilse 1'e sıfırlar.
 */
export async function touchStreak(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const admin = createAdminClient();
  if (!admin) return;

  const { data } = await admin
    .from("users")
    .select("streak_count,last_active_date")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return;

  const today = new Date().toISOString().slice(0, 10);
  if (data.last_active_date === today) return; // bugün zaten sayıldı

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const next = data.last_active_date === yesterday ? (data.streak_count ?? 0) + 1 : 1;

  await admin
    .from("users")
    .update({ streak_count: next, last_active_date: today })
    .eq("id", user.id);
}
