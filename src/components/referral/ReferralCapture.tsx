"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * URL'deki ?ref=<userId> değerini yakalar. Kullanıcı giriş yapmışsa ve
 * kendisi değilse referral kaydını oluşturur (her kullanıcı bir kez).
 */
export function ReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) {
      localStorage.setItem("notvia_ref", ref);
    }

    const stored = localStorage.getItem("notvia_ref");
    if (!stored) return;

    const supabase = createClient();
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id === stored) return;

      await supabase
        .from("referrals")
        .insert({ referrer_id: stored, referred_id: user.id });
      // başarılı ya da değil (zaten kayıtlı / geçersiz ref) — referansı temizle
      localStorage.removeItem("notvia_ref");
    })();
  }, []);

  return null;
}
