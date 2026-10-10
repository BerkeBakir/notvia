import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { iyzicoConfigured } from "@/lib/payments/config";
import { retrieveCheckout } from "@/lib/payments/iyzico";
import { applySubscription } from "@/lib/payments/sync";

/** iyzico ödeme formu bittikten sonra tarayıcıyı buraya POST eder (gövdede token). */
export async function POST(request: NextRequest) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const fail = (reason: string) => NextResponse.redirect(`${origin}/premium?odeme=${reason}`, 303);

  const admin = createAdminClient();
  if (!admin || !iyzicoConfigured()) return fail("kapali");

  const form = await request.formData().catch(() => null);
  const token = String(form?.get("token") ?? "");
  if (!token) return fail("hata");

  const { data: row } = await admin
    .from("payment_subscriptions")
    .select("id,user_id")
    .eq("checkout_token", token)
    .maybeSingle();
  if (!row) return fail("hata");

  // İstemciye değil iyzico'ya sor: ödeme gerçekten tamamlandı mı, hangi plan?
  const res = await retrieveCheckout(token);
  if (res.status !== "success" || !res.data) {
    await admin.from("payment_subscriptions").update({ status: "FAILED", updated_at: new Date().toISOString() }).eq("id", row.id);
    return fail("basarisiz");
  }
  const plan = await applySubscription(admin, row.id, row.user_id, res.data);
  return plan ? NextResponse.redirect(`${origin}/profile?upgraded=1`, 303) : fail("basarisiz");
}
