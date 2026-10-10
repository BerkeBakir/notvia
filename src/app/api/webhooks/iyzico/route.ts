import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { iyzicoConfigured } from "@/lib/payments/config";
import { getSubscription } from "@/lib/payments/iyzico";
import { applySubscription } from "@/lib/payments/sync";

/**
 * iyzico abonelik bildirimi (yenileme başarılı/başarısız, iptal...).
 * Gövdeye güvenilmez: yalnızca hangi aboneliğin değiştiğini söyler; güncel durum her zaman
 * iyzico API'sinden okunur. Sahte bir istek en fazla gereksiz bir senkron tetikler.
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  if (!admin || !iyzicoConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { subscriptionReferenceCode?: unknown } | null;
  const ref = typeof body?.subscriptionReferenceCode === "string" ? body.subscriptionReferenceCode : "";
  if (!ref) return NextResponse.json({ error: "bad request" }, { status: 400 });

  const { data: row } = await admin
    .from("payment_subscriptions")
    .select("id,user_id")
    .eq("reference_code", ref)
    .maybeSingle();
  if (!row) return NextResponse.json({ received: true });

  const res = await getSubscription(ref);
  if (res.status === "success" && res.data) await applySubscription(admin, row.id, row.user_id, res.data);
  return NextResponse.json({ received: true });
}
