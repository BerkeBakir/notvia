import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvelopeSimple, GearSix, GoogleLogo, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { DeleteSection, PasswordSection } from "@/components/account/AccountSettings";
import { SubscriptionSection } from "@/components/account/SubscriptionSection";

export const metadata = { title: "Hesap ayarları" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/ayarlar");

  const providers = (user.app_metadata?.providers as string[] | undefined) ?? [];
  const hasPassword = providers.includes("email");
  const hasGoogle = providers.includes("google");

  const { data: sub } = await supabase
    .from("payment_subscriptions")
    .select("plan,billing")
    .in("status", ["ACTIVE", "PENDING"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="inline-flex items-center gap-2 font-heading text-3xl font-bold tracking-tight text-foreground">
        <GearSix size={30} weight="duotone" className="text-primary" /> Hesap ayarları
      </h1>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold text-card-foreground">Hesap</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-1.5 text-muted">
              <EnvelopeSimple size={16} /> E-posta
            </dt>
            <dd className="truncate text-foreground">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted">Giriş yöntemleri</dt>
            <dd className="flex gap-2">
              {hasGoogle && (
                <span className="inline-flex items-center gap-1 rounded-full bg-border/60 px-2.5 py-0.5 text-xs text-foreground">
                  <GoogleLogo size={12} weight="bold" /> Google
                </span>
              )}
              {hasPassword && (
                <span className="rounded-full bg-border/60 px-2.5 py-0.5 text-xs text-foreground">E-posta + şifre</span>
              )}
            </dd>
          </div>
        </dl>
        <Link
          href="/profile/edit?next=/ayarlar"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary"
        >
          <PencilSimple size={15} /> Ad, üniversite, bölüm, sınıf
        </Link>
      </section>

      {sub && <SubscriptionSection plan={sub.plan} billing={sub.billing} />}
      <PasswordSection hasPassword={hasPassword} />
      <DeleteSection />
    </div>
  );
}
