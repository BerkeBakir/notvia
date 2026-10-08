"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

/**
 * E-posta onay linkinin indiği sayfa. Hangi tarayıcıda açılırsa açılsın çalışır:
 *  - #access_token=… (implicit akış) → oturumu kur
 *  - ?token_hash=…&type=… (e-posta şablonu token_hash ile ayarlandıysa) → doğrula
 *  - ?code=… (eski PKCE linkleri; yalnızca aynı tarayıcıda çalışır)
 * Başarılıysa profil tamamlama ekranına yönlendirir.
 */
export default function ConfirmPage() {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { isSingleton: false, auth: { detectSessionInUrl: false } },
    );
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);

    async function run() {
      const errDesc = hash.get("error_description") ?? query.get("error_description");
      const errCode = hash.get("error_code") ?? query.get("error_code");
      if (errDesc || errCode) {
        throw new Error(
          errCode === "otp_expired"
            ? "Bu onay linkinin süresi dolmuş ya da daha önce kullanılmış."
            : decodeURIComponent((errDesc ?? "Onay başarısız.").replace(/\+/g, " ")),
        );
      }
      const access_token = hash.get("access_token");
      const refresh_token = hash.get("refresh_token");
      const token_hash = query.get("token_hash");
      const code = query.get("code");

      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token });
        if (error) throw error;
      } else if (token_hash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: (query.get("type") as EmailOtpType) || "email",
        });
        if (error) throw error;
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw new Error("Bu link başka bir tarayıcıda başlatılmış. Aşağıdan giriş yapabilirsin — hesabın onaylandıysa girer.");
      } else {
        throw new Error("Geçersiz onay linki.");
      }
    }

    const isRecovery = (hash.get("type") ?? query.get("type")) === "recovery";

    run()
      .then(() => {
        setState("ok");
        if (isRecovery) {
          window.history.replaceState(null, "", "/auth/confirm");
          window.location.replace("/auth/yeni-sifre");
          return;
        }
        // Linkteki jetonları adres çubuğundan temizle, profile geç
        window.history.replaceState(null, "", "/auth/confirm");
        setTimeout(() => window.location.replace("/profile/edit?next=/notes"), 900);
      })
      .catch((e: unknown) => {
        setState("error");
        setMsg(e instanceof Error ? e.message : "Onay başarısız.");
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center">
        {state === "loading" && (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="mt-4 text-sm text-muted">Hesabın onaylanıyor…</p>
          </>
        )}
        {state === "ok" && (
          <>
            <div className="text-4xl">🎉</div>
            <h1 className="mt-3 font-heading text-xl font-bold text-foreground">Hesabın onaylandı!</h1>
            <p className="mt-2 text-sm text-muted">Profil bilgilerini doldurmaya yönlendiriliyorsun…</p>
          </>
        )}
        {state === "error" && (
          <>
            <div className="text-4xl">⚠️</div>
            <h1 className="mt-3 font-heading text-xl font-bold text-foreground">Onaylanamadı</h1>
            <p className="mt-2 text-sm text-muted">{msg}</p>
            <div className="mt-5 flex flex-col gap-2">
              <Link
                href="/login"
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Giriş yap
              </Link>
              <Link href="/login?mode=onay" className="text-sm text-primary hover:underline">
                Onay e-postasını tekrar gönder
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
