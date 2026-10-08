"use client";

import { useEffect, useState } from "react";
import { cleanReferralCode, storedReferralCode } from "@/lib/referralCode";
import { useFormStatus } from "react-dom";
import { CheckCircle, Circle, Eye, EyeSlash } from "@phosphor-icons/react";
import { signUpWithEmail } from "@/lib/actions/auth";
import { PASSWORD_RULES, passwordOk } from "@/lib/passwordRules";

const input =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
    >
      {pending ? "Hesap oluşturuluyor..." : "Kaydol"}
    </button>
  );
}

export function SignupForm() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [terms, setTerms] = useState(false);
  const [age, setAge] = useState(false);
  const [refCode, setRefCode] = useState("");

  // Davet linkinden gelindiyse kod kendiliğinden dolsun
  useEffect(() => {
    setRefCode(storedReferralCode());
  }, []);

  const ok = passwordOk(pw);
  const match = pw2.length > 0 && pw === pw2;

  return (
    <form action={signUpWithEmail} className="space-y-3">
      <input name="name" type="text" required maxLength={80} autoComplete="name" placeholder="Ad Soyad" className={input} />
      <input name="email" type="email" required autoComplete="email" placeholder="E-posta" className={input} />

      <div className="relative">
        <input
          name="password"
          type={show ? "text" : "password"}
          required
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Şifre"
          className={`${input} pr-11`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
        >
          {show ? <EyeSlash size={18} /> : <Eye size={18} />}
        </button>
      </div>

      <ul className="grid grid-cols-1 gap-1 rounded-xl border border-border bg-background/40 px-3 py-2.5 text-xs sm:grid-cols-2">
        {PASSWORD_RULES.map((r) => {
          const pass = r.test(pw);
          return (
            <li key={r.key} className={`flex items-center gap-1.5 ${pass ? "text-primary" : "text-muted"}`}>
              {pass ? <CheckCircle size={14} weight="fill" /> : <Circle size={14} />}
              {r.label}
            </li>
          );
        })}
      </ul>

      <div>
        <input
          name="password2"
          type={show ? "text" : "password"}
          required
          autoComplete="new-password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
          placeholder="Şifreyi tekrar yaz"
          className={`${input} ${pw2 && !match ? "border-red-500/60" : ""}`}
        />
        {pw2 && (
          <p className={`mt-1 text-xs ${match ? "text-primary" : "text-red-400"}`}>
            {match ? "✓ Şifreler eşleşiyor" : "Şifreler eşleşmiyor"}
          </p>
        )}
      </div>

      <input
        name="ref_code"
        value={refCode}
        onChange={(e) => setRefCode(cleanReferralCode(e.target.value))}
        autoComplete="off"
        placeholder="Davet kodu (opsiyonel, ör. 5164375E)"
        className={`${input} font-mono tracking-wider`}
      />

      <label className="flex cursor-pointer items-start gap-2 text-xs text-muted">
        <input
          type="checkbox"
          name="terms"
          checked={terms}
          onChange={(e) => setTerms(e.target.checked)}
          required
          className="mt-0.5 accent-[var(--primary)]"
        />
        <span>
          <a href="/terms" target="_blank" className="underline hover:text-foreground">Kullanım Şartları</a> ve{" "}
          <a href="/privacy" target="_blank" className="underline hover:text-foreground">Gizlilik Politikası</a>&apos;nı kabul ediyorum.
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-2 text-xs text-muted">
        <input
          type="checkbox"
          name="age"
          checked={age}
          onChange={(e) => setAge(e.target.checked)}
          required
          className="mt-0.5 accent-[var(--primary)]"
        />
        <span>18 yaşından büyüğüm.</span>
      </label>

      <Submit disabled={!ok || !match || !terms || !age} />
    </form>
  );
}
