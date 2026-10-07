import Link from "next/link";
import { signInWithEmail, signUpWithEmail } from "@/lib/actions/auth";
import { GoogleButton } from "@/components/auth/GoogleButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const sp = await searchParams;

  const inputClass =
    "w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted focus:border-primary";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 font-heading text-3xl font-bold text-foreground"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            N
          </span>
          Notvia
        </Link>
        <p className="mt-3 text-center text-sm text-muted">
          Notlarını paylaş, sınavlara birlikte hazırlan.
        </p>

        {sp.error && (
          <p className="mt-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {sp.error}
          </p>
        )}
        {sp.message && (
          <p className="mt-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">
            {sp.message}
          </p>
        )}

        <form action={signInWithEmail} className="mt-6 space-y-3">
          <h2 className="font-heading text-lg text-foreground">Giriş Yap</h2>
          <input
            name="email"
            type="email"
            required
            placeholder="E-posta"
            className={inputClass}
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Şifre"
            className={inputClass}
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground hover:opacity-90"
          >
            Giriş Yap
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          veya
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={signUpWithEmail} className="space-y-3">
          <h2 className="font-heading text-lg text-foreground">
            E-posta ile Kaydol
          </h2>
          <input
            name="name"
            type="text"
            placeholder="Ad Soyad"
            className={inputClass}
          />
          <input
            name="email"
            type="email"
            required
            placeholder="E-posta"
            className={inputClass}
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Şifre (en az 6 karakter)"
            className={inputClass}
          />
          <button
            type="submit"
            className="w-full rounded-lg border border-primary px-4 py-3 font-medium text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Kaydol
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          veya
          <span className="h-px flex-1 bg-border" />
        </div>

        <GoogleButton />

        <p className="mt-6 text-center text-xs text-muted">
          Kaydolarak{" "}
          <a href="/terms" className="underline hover:text-foreground">
            Kullanım Şartları
          </a>
          &apos;nı kabul etmiş ve 18 yaşından büyük olduğunu beyan etmiş olursun.
        </p>
      </div>
    </div>
  );
}
