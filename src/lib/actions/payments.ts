"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { iyzicoConfigured } from "@/lib/payments/config";
import { cancelSubscription, getSubscription } from "@/lib/payments/iyzico";
import { applySubscription } from "@/lib/payments/sync";

export type ActionResult = { ok: boolean; message: string };

const ANSWERS = ["evet", "belki", "hayir"];
const PRICES = ["0-25", "25-50", "50-100", "100+"];

/** "Premium alır mıydın?" anketi: kullanıcı başına tek cevap, tekrar gönderilirse güncellenir. */
export async function savePremiumInterest(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Cevap vermek için giriş yap." };

  const answer = String(formData.get("answer") ?? "");
  const plan = String(formData.get("plan") ?? "");
  const maxPrice = String(formData.get("max_price") ?? "");
  const wants = String(formData.get("wants") ?? "").trim().slice(0, 500);
  if (!ANSWERS.includes(answer)) return { ok: false, message: "Bir cevap seç." };

  const { error } = await supabase.from("premium_interest").upsert({
    user_id: user.id,
    answer,
    plan: plan === "premium" || plan === "pro" ? plan : null,
    max_price: PRICES.includes(maxPrice) ? maxPrice : null,
    wants: wants || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, message: "Kaydedilemedi, tekrar dene." };
  revalidatePath("/premium");
  return { ok: true, message: "Teşekkürler! Cevabın kaydedildi." };
}

/** Aktif aboneliği iptal et (mesafeli satış: tüketicinin iptal hakkı). */
export async function cancelMySubscription(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Oturumun sona ermiş." };
  const admin = createAdminClient();
  if (!admin || !iyzicoConfigured()) return { ok: false, message: "Ödeme sistemi yapılandırılmamış." };

  const { data: row } = await admin
    .from("payment_subscriptions")
    .select("id,reference_code")
    .eq("user_id", user.id)
    .in("status", ["ACTIVE", "PENDING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row?.reference_code) return { ok: false, message: "Aktif aboneliğin yok." };

  const res = await cancelSubscription(row.reference_code);
  if (res.status !== "success") return { ok: false, message: "İptal edilemedi: " + (res.errorMessage ?? "bilinmeyen hata") };

  const fresh = await getSubscription(row.reference_code);
  if (fresh.status === "success" && fresh.data) await applySubscription(admin, row.id, user.id, fresh.data);
  revalidatePath("/ayarlar");
  return { ok: true, message: "Aboneliğin iptal edildi. Bir daha ücret alınmayacak." };
}
