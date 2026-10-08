"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { PASSWORD_RULES, passwordOk } from "@/lib/passwordRules";

const input =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10";

/** Şifre sıfırlama linkinden sonra yeni şifre belirleme. */
export default function NewPasswordPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const ok = passwordOk(pw);
  const match = pw2.length > 0 && pw === pw2;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ok || !match) return;
    setBusy(true);
    setError("");
    const { error: err } = await createClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (err) {
      setError(
        err.message.toLowerCase().includes("session")
          ? "Linkin süresi dolmuş. Şifre sıfırlamayı tekrar iste."
          : err.message.toLowerCase().includes("different")
            ? "Yeni şifre eskisinden farklı olmalı."
            : err.message,
      );
      return;
    }
    setDone(true);
    setTimeout(() => window.location.replace("/notes"), 1200);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6">
        {done ? (
          <div className="text-center">
            <div className="text-4xl">✅</div>
            <h1 className="mt-3 font-heading text-xl font-bold text-foreground">Şifren güncellendi</h1>
            <p className="mt-2 text-sm text-muted">Yönlendiriliyorsun…</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <h1 className="font-heading text-xl font-bold text-foreground">Yeni şifre belirle</h1>
            <input
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Yeni şifre"
              className={input}
            />
            <ul className="grid grid-cols-1 gap-1 rounded-xl border border-border bg-background/40 px-3 py-2.5 text-xs">
              {PASSWORD_RULES.map((r) => (
                <li key={r.key} className={`flex items-center gap-1.5 ${r.test(pw) ? "text-primary" : "text-muted"}`}>
                  {r.test(pw) ? <CheckCircle size={14} weight="fill" /> : <Circle size={14} />}
                  {r.label}
                </li>
              ))}
            </ul>
            <input
              type="password"
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              placeholder="Yeni şifreyi tekrar yaz"
              className={input}
            />
            {pw2 && !match && <p className="text-xs text-red-400">Şifreler eşleşmiyor</p>}
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={!ok || !match || busy}
              className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Kaydediliyor..." : "Şifreyi güncelle"}
            </button>
            <Link href="/login?mode=sifre" className="block text-center text-xs text-muted hover:text-primary">
              Link çalışmadı mı? Tekrar iste
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
