import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { mapNoteRow } from "@/lib/supabase/mappers";
import { NoteCard } from "@/components/notes/NoteCard";

export default async function TagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: tag } = await supabase
    .from("tags")
    .select("id,name")
    .eq("id", id)
    .single();
  if (!tag) notFound();

  const { data: ntRows } = await supabase
    .from("note_tags")
    .select("note_id")
    .eq("tag_id", id);
  const noteIds = (ntRows ?? []).map((r) => r.note_id);

  const { data: noteRows } = noteIds.length
    ? await supabase
        .from("notes")
        .select("*")
        .in("id", noteIds)
        .order("quality_score", { ascending: false })
        .order("likes", { ascending: false })
    : { data: [] };
  const notes = (noteRows ?? []).map(mapNoteRow);

  const likedNoteIds = new Set<string>();
  if (user && notes.length) {
    const { data: likeRows } = await supabase
      .from("likes")
      .select("note_id")
      .eq("user_id", user.id)
      .in(
        "note_id",
        notes.map((n) => n.id),
      );
    for (const r of likeRows ?? []) likedNoteIds.add(r.note_id);
  }

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        #{tag.name}
      </h1>
      <p className="text-sm text-muted">{notes.length} not</p>

      {notes.length === 0 ? (
        <p className="text-muted">Bu etiketle not bulunamadı.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              userId={user?.id ?? null}
              liked={likedNoteIds.has(note.id)}
              isPro={user?.plan === "pro"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
