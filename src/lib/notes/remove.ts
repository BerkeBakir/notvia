import type { SupabaseClient } from "@supabase/supabase-js";

export const OWNER_DELETE_REASONS = {
  yanlis_ders: "Yanlış derse yükledim",
  yanlis_dosya: "Yanlış dosyayı yükledim",
  guncel_surum: "Güncel sürümünü yükleyeceğim",
  eksik_hatali: "Not eksik veya hatalı",
  telif: "Paylaşım hakkım olmadığını fark ettim",
  diger: "Diğer",
} as const;

export type OwnerDeleteReason = keyof typeof OWNER_DELETE_REASONS;

export function isOwnerDeleteReason(v: unknown): v is OwnerDeleteReason {
  return typeof v === "string" && Object.hasOwn(OWNER_DELETE_REASONS, v);
}

/** Herkese açık depolama URL'sinden "notes" kovasındaki dosya yolunu çıkarır. */
export function storagePathFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = "/object/public/notes/";
  const i = url.indexOf(marker);
  if (i < 0) return null;
  const path = decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
  return path && !path.includes("..") ? path : null;
}

/**
 * Notu tamamen kaldırır: kayıt düşer, PDF depodan silinir, not satırı silinir
 * (yorum, beğeni, AI parçaları vb. FK cascade ile gider). service_role istemcisi gerekir.
 */
export async function removeNote(
  admin: SupabaseClient,
  note: { id: string; user_id: string | null; course_id: string | null; title: string; file_url: string | null },
  meta: { by: "owner" | "moderator"; reason: string; detail?: string | null },
) {
  await admin.from("note_deletions").insert({
    note_id: note.id,
    user_id: note.user_id,
    course_id: note.course_id,
    title: note.title,
    deleted_by: meta.by,
    reason: meta.reason,
    detail: meta.detail?.trim().slice(0, 500) || null,
  });
  const { error } = await admin.from("notes").delete().eq("id", note.id);
  if (error) return { ok: false as const, error: error.message };
  const path = storagePathFromUrl(note.file_url);
  if (path) await admin.storage.from("notes").remove([path]);
  return { ok: true as const };
}
