import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { isBilling, isPaidPlan, paymentsEnabled, pricingPlanRef } from "@/lib/payments/config";
import { initSubscriptionCheckout } from "@/lib/payments/iyzico";

const Body = z.object({
  plan: z.string(),
  billing: z.string(),
  name: z.string().trim().min(2).max(60),
  surname: z.string().trim().min(2).max(60),
  gsmNumber: z.string().regex(/^\+?90?5\d{9}$|^05\d{9}$/),
  identityNumber: z
    .string()
    .regex(/^\d{11}$/)
    .optional()
    .or(z.literal("")),
  city: z.string().trim().min(2).max(40),
  address: z.string().trim().min(5).max(200),
});

/** iyzico biçimi: +905XXXXXXXXX */
function normalizeGsm(v: string) {
  const digits = v.replace(/\D/g, "");
  return "+90" + digits.slice(-10);
}

export async function POST(request: NextRequest) {
  if (!paymentsEnabled()) {
    return NextResponse.json({ error: "Ödeme henüz aktif değil." }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Bilgileri kontrol et." }, { status: 400 });
  const b = parsed.data;
  if (!isPaidPlan(b.plan) || !isBilling(b.billing)) {
    return NextResponse.json({ error: "Geçersiz plan." }, { status: 400 });
  }
  const ref = pricingPlanRef(b.plan, b.billing);
  const admin = createAdminClient();
  if (!ref || !admin) return NextResponse.json({ error: "Plan yapılandırılmamış." }, { status: 503 });

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const res = await initSubscriptionCheckout({
    pricingPlanReferenceCode: ref,
    callbackUrl: `${origin}/api/payments/iyzico/callback`,
    conversationId: user.id,
    customer: {
      name: b.name,
      surname: b.surname,
      email: user.email,
      gsmNumber: normalizeGsm(b.gsmNumber),
      // TCKN zorunlu alan; girilmezse iyzico'nun kabul ettiği varsayılan kullanılır
      identityNumber: b.identityNumber || "11111111111",
      city: b.city,
      address: b.address,
    },
  });
  if (res.status !== "success" || !res.token || !res.checkoutFormContent) {
    return NextResponse.json({ error: res.errorMessage ?? "Ödeme başlatılamadı." }, { status: 502 });
  }

  // Geri dönüşte oturum çerezi gelmeyebilir (çapraz site POST); kullanıcıyı token ile eşleştir.
  await admin.from("payment_subscriptions").insert({
    user_id: user.id,
    plan: b.plan,
    billing: b.billing,
    checkout_token: res.token,
  });

  return NextResponse.json({ checkoutFormContent: res.checkoutFormContent });
}
