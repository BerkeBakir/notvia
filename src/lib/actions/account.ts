"use server";

import { createClient as createSupabase } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { passwordOk } from "@/lib/passwordRules";

export type ActionResult = { ok: boolean; message: string };

/** Şifre değiştir / (Google ile girenler için) şifre belirle. Mevcut şifre varsa önce doğrulanır. */
export async function changePassword(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, message: "Oturumun sona ermiş, tekrar giriş yap." };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const next2 = String(formData.get("next2") ?? "");
  const hasPassword = (user.app_metadata?.providers as string[] | undefined)?.includes("email") ?? false;

  if (!passwordOk(next)) return { ok: false, message: "Yeni şifre kurallara uymuyor." };
  if (next !== next2) return { ok: false, message: "Yeni şifreler eşleşmiyor." };

  if (hasPassword) {
    if (!current) return { ok: false, message: "Mevcut şifreni yaz." };
    // Mevcut şifreyi, oturum çerezlerine dokunmayan ayrı bir istemciyle doğrula
    const probe = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await probe.auth.signInWithPassword({ email: user.email, password: current });
    if (error) return { ok: false, message: "Mevcut şifre hatalı." };
    if (current === next) return { ok: false, message: "Yeni şifre eskisinden farklı olmalı." };
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { ok: false, message: error.message.includes("different") ? "Yeni şifre eskisinden farklı olmalı." : error.message };
  return { ok: true, message: hasPassword ? "Şifren güncellendi." : "Şifren belirlendi. Artık e-posta + şifreyle de girebilirsin." };
}

/** Hesabı ve tüm verilerini kalıcı olarak sil (KVKK: silme hakkı). */
export async function deleteAccount(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  if (String(formData.get("confirm") ?? "").trim().toLocaleUpperCase("tr") !== "SİL") {
    return { ok: false, message: "Onaylamak için kutuya SİL yaz." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Oturumun sona ermiş." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Sunucu yapılandırılmamış, info@notvia.app'e yaz." };

  // Yüklenen PDF'leri depodan sil
  const { data: files } = await admin.storage.from("notes").list(user.id, { limit: 1000 });
  if (files?.length) await admin.storage.from("notes").remove(files.map((f) => `${user.id}/${f.name}`));

  // Profil satırı (notlar, yorumlar, beğeniler vb. FK cascade ile gider), sonra kimlik
  await admin.from("users").delete().eq("id", user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, message: "Silinemedi, info@notvia.app'e yaz: " + error.message };

  await supabase.auth.signOut();
  redirect("/?hesap=silindi");
}
