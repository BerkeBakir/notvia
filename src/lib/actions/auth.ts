"use server";

import { createClient as createSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { passwordOk } from "@/lib/passwordRules";

/**
 * E-posta onayı için "implicit" akışlı istemci: onay linki hangi tarayıcıda
 * (ör. Gmail uygulamasının içindeki) açılırsa açılsın çalışır. PKCE akışı,
 * kaydın yapıldığı tarayıcıdaki gizli anahtarı istediği için başka cihazda patlıyordu.
 */
function implicitClient() {
  return createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL || (await headers()).get("origin") || "https://notvia.app";
}

const back = (mode: string, key: "error" | "message", msg: string, extra = "") =>
  `/login?mode=${mode}&${key}=${encodeURIComponent(msg)}${extra}`;

function trError(msg: string) {
  const m = msg.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) return "Bu e-posta zaten kayıtlı. Giriş yapmayı dene.";
  if (m.includes("invalid login")) return "E-posta ya da şifre hatalı.";
  if (m.includes("email not confirmed")) return "E-postanı henüz onaylamadın. Gelen kutunu kontrol et.";
  if (m.includes("rate limit") || m.includes("security purposes")) return "Çok fazla deneme. Biraz bekleyip tekrar dene.";
  if (m.includes("password")) return "Şifre kurallara uymuyor (en az 8 karakter).";
  return msg;
}

export async function signUpWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const refCode = String(formData.get("ref_code") ?? "").replace(/[^0-9a-fA-F]/g, "").slice(0, 8).toUpperCase();

  if (!email || !password) redirect(back("kaydol", "error", "E-posta ve şifre gerekli."));
  if (!passwordOk(password))
    redirect(back("kaydol", "error", "Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermeli."));
  if (password !== password2) redirect(back("kaydol", "error", "Şifreler eşleşmiyor."));
  if (!formData.get("terms") || !formData.get("age"))
    redirect(back("kaydol", "error", "Devam etmek için iki onayı da işaretlemelisin."));

  const { data, error } = await implicitClient().auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name || email.split("@")[0], ...(refCode.length === 8 ? { ref_code: refCode } : {}) },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm`,
    },
  });
  if (error) redirect(back("kaydol", "error", trError(error.message)));
  // Supabase, zaten onaylı bir e-postada hata vermeden boş kimlikle döner (hesap varlığını sızdırmamak için)
  if (data.user && (data.user.identities?.length ?? 0) === 0) {
    redirect(back("giris", "error", "Bu e-posta zaten kayıtlı. Giriş yap ya da şifreni sıfırla."));
  }

  redirect(`/login?mode=onay&email=${encodeURIComponent(email)}`);
}

export async function resendConfirmation(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/login?mode=kaydol");
  const { error } = await implicitClient().auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/confirm` },
  });
  const q = `&email=${encodeURIComponent(email)}`;
  if (error) redirect(back("onay", "error", trError(error.message), q));
  redirect(back("onay", "message", "Onay e-postasını tekrar gönderdik.", q));
}

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const extra = error.message.toLowerCase().includes("email not confirmed") ? `&email=${encodeURIComponent(email)}` : "";
    redirect(back(extra ? "onay" : "giris", "error", trError(error.message), extra));
  }
  redirect("/notes");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect(back("sifre", "error", "E-posta adresini yaz."));
  await implicitClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/confirm`,
  });
  // Hesap var/yok bilgisini sızdırmamak için her durumda aynı mesaj
  redirect(back("sifre", "message", "Bu e-postayla bir hesap varsa şifre sıfırlama linki gönderdik."));
}
