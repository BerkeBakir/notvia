import Link from "next/link";
import { redirect } from "next/navigation";
import { EnvelopeSimpleOpen } from "@phosphor-icons/react/dist/ssr";
import { requestPasswordReset, resendConfirmation, signInWithEmail } from "@/lib/actions/auth";
import { GoogleButton } from "@/components/auth/GoogleButton";
import { SignupForm } from "@/components/auth/SignupForm";
import { getCurrentUser } from "@/lib/supabase/auth";

const input =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string; mode?: string; email?: string }>;
}) {
  const sp = await searchParams;
  // Zaten girişliyse giriş ekranı gösterme
  if (await getCurrentUser()) redirect("/notes");

  const mode =
    sp.mode === "kaydol" ? "kaydol" : sp.mode === "onay" ? "onay" : sp.mode === "sifre" ? "sifre" : "giris";
  const email = (sp.email ?? "").slice(0, 200);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center justify-center gap-2 font-heading text-3xl font-bold text-foreground">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">N</span>
          Notvia
        </Link>
        <p className="mt-3 text-center text-sm text-muted">Notlarını paylaş, sınavlara birlikte hazırlan.</p>

        {sp.error && (
          <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">{sp.error}</p>
        )}
        {sp.message && (
          <p className="mt-6 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">{sp.message}</p>
        )}

        {mode === "sifre" ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <h1 className="font-heading text-xl font-bold text-foreground">Şifreni sıfırla</h1>
            <p className="mt-1 text-sm text-muted">E-postanı yaz, şifre yenileme linki gönderelim.</p>
            <form action={requestPasswordReset} className="mt-4 space-y-3">
              <input name="email" type="email" required autoComplete="email" placeholder="E-posta" className={input} />
              <button
                type="submit"
                className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90"
              >
                Link gönder
              </button>
            </form>
            <Link href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">
              Giriş ekranına dön
            </Link>
          </div>
        ) : mode === "onay" ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
            <EnvelopeSimpleOpen size={44} weight="duotone" className="mx-auto text-primary" />
            <h1 className="mt-3 font-heading text-xl font-bold text-foreground">E-postanı onayla</h1>
            <p className="mt-2 text-sm text-muted">
              {email ? (
                <>
                  <b className="text-foreground">{email}</b> adresine bir onay linki gönderdik.
                </>
              ) : (
                "E-posta adresine bir onay linki gönderdik."
              )}{" "}
              Üyeliğin, linke tıklayıp hesabını onayladığında aktifleşir. Ardından profil bilgilerini dolduracaksın.
            </p>
            <p className="mt-3 text-xs text-muted">Gelmediyse Spam / Gereksiz klasörüne de bak.</p>
            {(
              <form action={resendConfirmation} className="mt-4 space-y-2">
                {email ? (
                  <input type="hidden" name="email" value={email} />
                ) : (
                  <input name="email" type="email" required placeholder="E-posta adresin" className={input} />
                )}
                <button
                  type="submit"
                  className="rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary"
                >
                  Onay e-postasını tekrar gönder
                </button>
              </form>
            )}
            <Link href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">
              Giriş ekranına dön
            </Link>
          </div>
        ) : (
          <>
            {/* Giriş / Kaydol sekmeleri */}
            <div className="mt-6 grid grid-cols-2 gap-1 rounded-2xl border border-border bg-card p-1">
              {[
                ["giris", "Giriş Yap"],
                ["kaydol", "Kaydol"],
              ].map(([k, l]) => (
                <Link
                  key={k}
                  href={k === "kaydol" ? "/login?mode=kaydol" : "/login"}
                  className={`rounded-xl px-4 py-2 text-center text-sm font-medium transition ${
                    mode === k ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  {l}
                </Link>
              ))}
            </div>

            <div className="mt-5">
              <GoogleButton />
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" />
              {mode === "kaydol" ? "ya da e-posta ile kaydol" : "ya da e-posta ile"}
              <span className="h-px flex-1 bg-border" />
            </div>

            {mode === "giris" ? (
              <form action={signInWithEmail} className="space-y-3">
                <input name="email" type="email" required autoComplete="email" placeholder="E-posta" className={input} />
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Şifre"
                  className={input}
                />
                <div className="text-right">
                  <Link href="/login?mode=sifre" className="text-xs text-muted hover:text-primary">
                    Şifremi unuttum
                  </Link>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90"
                >
                  Giriş Yap
                </button>
                <p className="text-center text-xs text-muted">
                  Hesabın yok mu?{" "}
                  <Link href="/login?mode=kaydol" className="font-medium text-primary hover:underline">
                    Kaydol
                  </Link>
                </p>
              </form>
            ) : (
              <>
                <SignupForm />
                <p className="mt-3 text-center text-xs text-muted">
                  Zaten hesabın var mı?{" "}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Giriş yap
                  </Link>
                </p>
              </>
            )}

            <p className="mt-6 text-center text-xs text-muted">
              Google ile devam ederek{" "}
              <a href="/terms" className="underline hover:text-foreground">
                Kullanım Şartları
              </a>
              &apos;nı kabul etmiş ve 18 yaşından büyük olduğunu beyan etmiş olursun.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
