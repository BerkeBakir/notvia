import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isPaid } from "@/lib/supabase/auth";
import { mapNoteRow } from "@/lib/supabase/mappers";
import { NoteCard } from "@/components/notes/NoteCard";
import { NotificationToggle } from "@/components/notes/NotificationToggle";
import { VerifyButton } from "@/components/notes/VerifyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { CourseStudy, type StudySource } from "@/components/study/CourseStudy";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("name,instructor")
    .eq("id", id)
    .maybeSingle();
  if (!course) return { title: "Ders bulunamadı" };
  return {
    title: course.name,
    description: `${course.name}${course.instructor ? ` (${course.instructor})` : ""} dersine ait ders notları ve geçmiş sınav soruları.`,
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: course } = await supabase
    .from("courses")
    .select("id,name,instructor,department_id,verified")
    .eq("id", id)
    .single();

  if (!course) notFound();

  // Doğrulama durumu
  const { count: verifyCount } = await supabase
    .from("course_verifications")
    .select("id", { count: "exact", head: true })
    .eq("course_id", id);
  let verifiedByMe = false;
  if (user) {
    const { data: myVerif } = await supabase
      .from("course_verifications")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", id)
      .maybeSingle();
    verifiedByMe = !!myVerif;
  }

  const { data: department } = await supabase
    .from("departments")
    .select("id,name,university_id")
    .eq("id", course.department_id)
    .single();

  const { data: university } = department
    ? await supabase
        .from("universities")
        .select("id,name")
        .eq("id", department.university_id)
        .single()
    : { data: null };

  const { data: noteRows } = await supabase
    .from("notes")
    .select("*")
    .eq("course_id", id)
    .order("created_at", { ascending: false });

  const studySources: StudySource[] = (noteRows ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    aiIndexed: r.ai_indexed ?? null,
  }));

  const notes = (noteRows ?? [])
    .map(mapNoteRow)
    .sort((a, b) => b.likes - a.likes);

  let subscribed = false;
  const likedNoteIds = new Set<string>();
  if (user) {
    const { data: sub } = await supabase
      .from("course_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", id)
      .maybeSingle();
    subscribed = !!sub;

    if (notes.length > 0) {
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
  }

  // Premium kilidi: 3'ten fazla not varsa, en çok beğenilen ilk 3 ücretsize kilitli
  const canSeeTop = !user ? false : isPaid(user.plan);
  const lockTopCount = notes.length > 3 && !canSeeTop ? 3 : 0;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/notes" className="hover:text-primary">
          Keşfet
        </Link>
        {university && <span> / {university.name}</span>}
        {department && <span> / {department.name}</span>}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-card-foreground">
            {course.name}
          </h1>
          {course.instructor && (
            <p className="mt-1 text-sm text-muted">{course.instructor}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted">{notes.length} içerik</span>
            <VerifyButton
              courseId={course.id}
              userId={user?.id ?? null}
              verified={course.verified ?? false}
              initialVerifiedByMe={verifiedByMe}
              initialCount={verifyCount ?? 0}
            />
          </div>
        </div>
        <NotificationToggle
          courseId={course.id}
          userId={user?.id ?? null}
          initialSubscribed={subscribed}
        />
      </div>

      <CourseStudy
        courseId={course.id}
        courseName={course.name}
        sources={studySources}
        loggedIn={!!user}
      />

      {notes.length === 0 ? (
        <EmptyState
          icon="📄"
          title="Bu ders için henüz içerik yok"
          description="İlk ders notunu veya çıkmış sınav sorusunu sen paylaş."
          action={{ href: "/notes/upload", label: "İlk Notu Yükle" }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note, i) => (
            <NoteCard
              key={note.id}
              note={note}
              userId={user?.id ?? null}
              liked={likedNoteIds.has(note.id)}
              locked={i < lockTopCount}
              isPro={user?.plan === "pro"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
