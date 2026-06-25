import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getStripe, priceIdFor } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Giriş yapmalısın." }, { status: 401 });
  }

  const { plan } = await request.json().catch(() => ({}));
  if (plan !== "premium" && plan !== "pro") {
    return NextResponse.json({ error: "Geçersiz plan." }, { status: 400 });
  }

  const stripe = getStripe();
  const priceId = priceIdFor(plan);
  if (!stripe || !priceId) {
    return NextResponse.json(
      { error: "Ödeme henüz aktif değil. Çok yakında!" },
      { status: 503 },
    );
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/profile?upgraded=1`,
    cancel_url: `${origin}/premium`,
    customer_email: user.email,
    metadata: { userId: user.id, plan },
    subscription_data: { metadata: { userId: user.id, plan } },
  });

  return NextResponse.json({ url: session.url });
}
