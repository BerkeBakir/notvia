"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";

/** Bir AI cevabını kişisel "Kaydedilenler"e ekler. */
export async function saveAnswer(
  content: string,
  sources?: { noteId: string }[],
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Giriş yapmalısın." };
  const text = content.trim();
  if (!text) return { ok: false, error: "Boş içerik." };
  if (text.length > 20000) return { ok: false, error: "İçerik çok uzun." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("ai_saved_answers")
    .insert({ user_id: user.id, content: text, sources: sources ?? null });
  if (error) return { ok: false, error: "Kaydedilemedi." };
  return { ok: true };
}

/** Kaydedilen bir cevabı siler. */
export async function deleteSavedAnswer(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const supabase = await createClient();
  await supabase.from("ai_saved_answers").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/kaydedilenler");
}
