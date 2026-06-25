import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { mapNoteRow } from "@/lib/supabase/mappers";
import { NoteCard } from "@/components/notes/NoteCard";

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: department } = await supabase
    .from("departments")
    .select("id,name,university_id")
    .eq("id", id)
    .single();
  if (!department) notFound();

  const { data: university } = await supabase
    .from("universities")
    .select("id,name")
    .eq("id", department.university_id)
    .single();

  const { data: courses } = await supabase
    .from("courses")
    .select("id,name,instructor")
    .eq("department_id", id)
    .order("name");

  const courseIds = (courses ?? []).map((c) => c.id);

  // Bölümün en çok beğenilen notları
  const { data: noteRows } = courseIds.length
    ? await supabase
        .from("notes")
        .select("*")
        .in("course_id", courseIds)
        .order("likes", { ascending: false })
        .limit(9)
    : { data: [] };

  const topNotes = (noteRows ?? []).map(mapNoteRow);

  // Beğeni durumu
  const likedNoteIds = new Set<string>();
  if (user && topNotes.length) {
    const { data: likeRows } = await supabase
      .from("likes")
      .select("note_id")
      .eq("user_id", user.id)
      .in(
        "note_id",
        topNotes.map((n) => n.id),
      );
    for (const r of likeRows ?? []) likedNoteIds.add(r.note_id);
  }

  return (
    <div className="space-y-8">
      <div>
        <nav className="text-sm text-muted">
          <Link href="/notes" className="hover:text-primary">
            Keşfet
          </Link>
          {university && <span> / {university.name}</span>}
        </nav>
        <h1 className="mt-2 font-heading text-3xl font-bold text-foreground">
          {department.name}
        </h1>
      </div>

      <section>
        <h2 className="font-heading text-xl text-foreground">
          🔥 En Beğenilen Notlar
        </h2>
        {topNotes.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Bu bölümde henüz not yok.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topNotes.map((note) => (
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
      </section>

      <section>
        <h2 className="font-heading text-xl text-foreground">Dersler</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {(courses ?? []).length === 0 && (
            <p className="text-sm text-muted">Henüz ders eklenmemiş.</p>
          )}
          {(courses ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.id}`}
              className="rounded-xl border border-border bg-card p-4 hover:border-primary/50"
            >
              <span className="font-medium text-card-foreground">{c.name}</span>
              {c.instructor && (
                <span className="ml-2 text-sm text-muted">· {c.instructor}</span>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
