"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Beğeni / beğenmeme / kaydet sunucu eylemleri. Form "action"ı olarak kullanılır:
 * sayfa henüz etkileşime hazır değilken (JS yüklenmeden) tıklansa bile çalışır.
 * Hazır olduktan sonra React aynı eylemi sayfa yenilemeden çağırır.
 */
async function ctx(noteId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/notes/${noteId}`);
  return { supabase, uid: user.id };
}

async function isOwner(supabase: Awaited<ReturnType<typeof createClient>>, noteId: string, uid: string) {
  const { data } = await supabase.from("notes").select("user_id").eq("id", noteId).maybeSingle();
  return data?.user_id === uid;
}

async function toggle(table: "likes" | "dislikes" | "saves", noteId: string, uid: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: row } = await supabase.from(table).select("id").eq("user_id", uid).eq("note_id", noteId).maybeSingle();
  if (row) {
    await supabase.from(table).delete().eq("user_id", uid).eq("note_id", noteId);
    return false;
  }
  await supabase.from(table).insert({ user_id: uid, note_id: noteId });
  return true;
}

export async function toggleLike(noteId: string) {
  const { supabase, uid } = await ctx(noteId);
  if (await isOwner(supabase, noteId, uid)) return;
  const nowLiked = await toggle("likes", noteId, uid, supabase);
  if (nowLiked) await supabase.from("dislikes").delete().eq("user_id", uid).eq("note_id", noteId);
  revalidatePath(`/notes/${noteId}`);
}

export async function toggleDislike(noteId: string) {
  const { supabase, uid } = await ctx(noteId);
  if (await isOwner(supabase, noteId, uid)) return;
  const nowDisliked = await toggle("dislikes", noteId, uid, supabase);
  if (nowDisliked) await supabase.from("likes").delete().eq("user_id", uid).eq("note_id", noteId);
  revalidatePath(`/notes/${noteId}`);
}

export async function toggleSave(noteId: string) {
  const { supabase, uid } = await ctx(noteId);
  await toggle("saves", noteId, uid, supabase);
  revalidatePath(`/notes/${noteId}`);
}
