import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { mapNoteRow } from "@/lib/supabase/mappers";
import { NoteCard } from "@/components/notes/NoteCard";
import { SearchFilters } from "@/components/notes/SearchFilters";
import { TopicSearch } from "@/components/notes/TopicSearch";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; dep?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const [universitiesRes, departmentsRes] = await Promise.all([
    supabase.from("universities").select("id,name").order("name"),
    supabase.from("departments").select("id,name,university_id").order("name"),
  ]);

  // Seçilen bölümün üniversitesini bul (filtre ön-seçimi için)
  let selectedUniversity = "";
  if (sp.dep) {
    const dep = (departmentsRes.data ?? []).find((d) => d.id === sp.dep);
    selectedUniversity = dep?.university_id ?? "";
  }

  // Arama
  const hasQuery = !!sp.q || !!sp.dep;
  let notes: ReturnType<typeof mapNoteRow>[] = [];
  if (hasQuery) {
    let courseIds: string[] | null = null;
    if (sp.dep) {
      const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("department_id", sp.dep);
      courseIds = (courses ?? []).map((c) => c.id);
    }

    const sortColumn =
      sp.sort === "created"
        ? "created_at"
        : sp.sort === "downloads"
          ? "downloads"
          : "likes";

    let query = supabase
      .from("notes")
      .select("*")
      .order(sortColumn, { ascending: false })
      .limit(30);
    if (courseIds) query = query.in("course_id", courseIds);
    if (sp.q) query = query.ilike("title", `%${sp.q}%`);

    const { data } = await query;
    notes = (data ?? []).map(mapNoteRow);
  }

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
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Ara</h1>
        <p className="mt-1 text-sm text-muted">
          Not başlığında ara, üniversite ve bölüme göre filtrele.
        </p>
      </div>

      {user && <TopicSearch />}

      <SearchFilters
        universities={universitiesRes.data ?? []}
        departments={departmentsRes.data ?? []}
        initialQuery={sp.q ?? ""}
        initialUniversity={selectedUniversity}
        initialDepartment={sp.dep ?? ""}
        initialSort={sp.sort ?? "likes"}
      />

      {hasQuery && (
        <div>
          <p className="mb-4 text-sm text-muted">{notes.length} sonuç</p>
          {notes.length === 0 ? (
            <p className="text-muted">Eşleşen not bulunamadı.</p>
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
      )}
    </div>
  );
}
