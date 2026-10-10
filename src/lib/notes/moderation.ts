import type { SupabaseClient } from "@supabase/supabase-js";
import { removeNote } from "./remove";

/** Moderatör kararı: şikayetçilere "incelendi", not sahibine sonuç bildirimi gider. */
async function notify(admin: SupabaseClient, rows: { user_id: string; type: string; message: string; link: string | null }[]) {
  if (rows.length) await admin.from("notifications").insert(rows);
}

async function reporterIds(admin: SupabaseClient, noteId: string, ownerId: string | null) {
  const { data } = await admin.from("reports").select("user_id").eq("note_id", noteId);
  return [...new Set((data ?? []).map((r) => r.user_id as string | null))].filter(
    (u): u is string => !!u && u !== ownerId,
  );
}

async function loadNote(admin: SupabaseClient, noteId: string) {
  const { data } = await admin
    .from("notes")
    .select("id,user_id,course_id,title,file_url,hidden_at")
    .eq("id", noteId)
    .maybeSingle();
  return data;
}

/** Şikayeti haklı bul: notu kaldır. */
export async function moderateRemove(admin: SupabaseClient, noteId: string, reason: string) {
  const note = await loadNote(admin, noteId);
  if (!note) return { ok: false as const, error: "Not bulunamadı." };
  const reporters = await reporterIds(admin, noteId, note.user_id);
  const res = await removeNote(admin, note, { by: "moderator", reason: reason || "moderasyon" });
  if (!res.ok) return res;
  await notify(admin, [
    ...(note.user_id
      ? [
          {
            user_id: note.user_id,
            type: "note_removed",
            message: `"${note.title}" notun inceleme sonucunda kaldırıldı. Sebep: ${reason || "topluluk kurallarına aykırı"}. İtiraz için info@notvia.app.`,
            link: "/terms",
          },
        ]
      : []),
    ...reporters.map((u) => ({
      user_id: u,
      type: "report_reviewed",
      message: `Şikayet ettiğin "${note.title}" notu incelendi ve kaldırıldı. Teşekkürler!`,
      link: null,
    })),
  ]);
  return { ok: true as const };
}

/** Şikayeti haksız bul: notu tekrar yayına al, şikayetleri kapat. */
export async function moderateRestore(admin: SupabaseClient, noteId: string) {
  const note = await loadNote(admin, noteId);
  if (!note) return { ok: false as const, error: "Not bulunamadı." };
  const reporters = await reporterIds(admin, noteId, note.user_id);
  const { error } = await admin.from("notes").update({ hidden_at: null }).eq("id", noteId);
  if (error) return { ok: false as const, error: error.message };
  await admin.from("reports").delete().eq("note_id", noteId);
  await notify(admin, [
    ...(note.user_id && note.hidden_at
      ? [
          {
            user_id: note.user_id,
            type: "note_restored",
            message: `"${note.title}" notun incelendi ve tekrar yayında.`,
            link: `/notes/${noteId}`,
          },
        ]
      : []),
    ...reporters.map((u) => ({
      user_id: u,
      type: "report_reviewed",
      message: `Şikayet ettiğin "${note.title}" notu incelendi; kurallara aykırı bir durum bulunmadı.`,
      link: `/notes/${noteId}`,
    })),
  ]);
  return { ok: true as const };
}
