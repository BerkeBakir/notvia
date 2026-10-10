"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isOwnerDeleteReason, removeNote } from "@/lib/notes/remove";

export type ActionResult = { ok: boolean; message: string };

/** Not sahibinin kendi notunu sebep belirterek silmesi. */
export async function deleteMyNote(_: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const noteId = String(formData.get("noteId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const detail = String(formData.get("detail") ?? "");
  if (!isOwnerDeleteReason(reason)) return { ok: false, message: "Bir sebep seç." };
  if (reason === "diger" && detail.trim().length < 3) return { ok: false, message: "Kısaca sebebini yaz." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Oturumun sona ermiş." };

  const { data: note } = await supabase
    .from("notes")
    .select("id,user_id,course_id,title,file_url")
    .eq("id", noteId)
    .maybeSingle();
  if (!note || note.user_id !== user.id) return { ok: false, message: "Bu notu yalnızca yükleyen silebilir." };

  const admin = createAdminClient();
  if (!admin) return { ok: false, message: "Sunucu yapılandırılmamış." };
  const res = await removeNote(admin, note, { by: "owner", reason, detail });
  if (!res.ok) return { ok: false, message: "Silinemedi: " + res.error };

  revalidatePath("/profile");
  if (note.course_id) revalidatePath(`/courses/${note.course_id}`);
  redirect("/profile?not=silindi");
}
