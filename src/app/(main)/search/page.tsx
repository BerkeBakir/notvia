import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { mapNoteRow } from "@/lib/supabase/mappers";
import { NoteCard } from "@/components/notes/NoteCard";
import { SearchFilters } from "@/components/notes/SearchFilters";
import { TopicSearch } from "@/components/notes/TopicSearch";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { Clock, Hash } from "@phosphor-icons/react/dist/ssr";

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

  // Arama yokken keşif içeriği: popüler etiketler + son eklenenler
  let popularTags: { id: string; name: string; count: number }[] = [];
  let recent: ReturnType<typeof mapNoteRow>[] = [];
  if (!hasQuery) {
    const [tagsRes, recentRes] = await Promise.all([
      supabase.from("tags").select("id,name,note_tags(count)"),
      supabase.from("notes").select("*").order("created_at", { ascending: false }).limit(6),
    ]);
    popularTags = (tagsRes.data ?? [])
      .map((t) => ({
        id: t.id as string,
        name: t.name as string,
        count: (t.note_tags as unknown as { count: number }[])?.[0]?.count ?? 0,
      }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
    recent = (recentRes.data ?? []).map(mapNoteRow);
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
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Ara</h1>
        <p className="mt-1 text-sm text-muted">
          Başlıkla ara ve filtrele ya da AI ile konuya göre notları bul.
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

      {hasQuery ? (
        <section>
          <h2 className="mb-4 text-sm text-muted">
            <span className="font-medium text-foreground">{notes.length}</span> sonuç
            {sp.q && (
              <>
                {" "}· <span className="text-foreground">&ldquo;{sp.q}&rdquo;</span>
              </>
            )}
          </h2>
          {notes.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="Eşleşen not bulunamadı"
              description="Farklı bir kelime dene, filtreleri temizle ya da AI ile konu aramayı kullan. Notu sen paylaşabilirsin!"
              action={{ href: "/notes/upload", label: "Not yükle" }}
            />
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
        </section>
      ) : (
        <>
          {popularTags.length > 0 && (
            <section>
              <h2 className="mb-3 inline-flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
                <Hash size={20} weight="duotone" className="text-primary" />
                Popüler etiketler
              </h2>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tags/${t.id}`}
                    className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm text-foreground transition hover:border-primary hover:text-primary"
                  >
                    #{t.name} <span className="text-xs text-muted">{t.count}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
          {recent.length > 0 && (
            <section>
              <h2 className="mb-3 inline-flex items-center gap-2 font-heading text-lg font-semibold text-foreground">
                <Clock size={20} weight="duotone" className="text-primary" />
                Son eklenenler
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recent.map((note) => (
                  <NoteCard key={note.id} note={note} userId={user?.id ?? null} isPro={user?.plan === "pro"} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
