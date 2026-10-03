import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isPaid } from "@/lib/supabase/auth";
import { AdSlot } from "@/components/ads/AdSlot";
import { VoteButtons } from "@/components/notes/VoteButtons";
import { DownloadButton } from "@/components/notes/DownloadButton";
import { FavoriteButton } from "@/components/notes/FavoriteButton";
import { ReportButton } from "@/components/notes/ReportButton";
import { AiSummary } from "@/components/notes/AiSummary";
import { AiTools } from "@/components/notes/AiTools";
import { NoteCard } from "@/components/notes/NoteCard";
import { mapNoteRow } from "@/lib/supabase/mappers";
import {
  CommentSection,
  type CommentItem,
} from "@/components/notes/CommentSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: note } = await supabase
    .from("notes")
    .select("title,description,type")
    .eq("id", id)
    .maybeSingle();
  if (!note) return { title: "Not bulunamadı" };
  const kind = note.type === "exam" ? "Sınav Sorusu" : "Ders Notu";
  const desc = note.description || `${kind} — Notvia'da paylaşıldı.`;
  return {
    title: note.title,
    description: desc,
    openGraph: { title: `${note.title} — Notvia`, description: desc },
  };
}

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();

  const { data: note } = await supabase
    .from("notes")
    .select(
      "id,title,description,type,file_url,downloads,likes,dislikes,course_id,user_id",
    )
    .eq("id", id)
    .single();
  if (!note) notFound();

  const { data: course } = note.course_id
    ? await supabase
        .from("courses")
        .select("id,name")
        .eq("id", note.course_id)
        .single()
    : { data: null };

  // Paylaşan kullanıcı
  const { data: uploader } = note.user_id
    ? await supabase.from("users").select("id,name").eq("id", note.user_id).maybeSingle()
    : { data: null };

  // Etiketler
  const { data: ntRows } = await supabase
    .from("note_tags")
    .select("tag_id")
    .eq("note_id", id);
  const tagIds = (ntRows ?? []).map((r) => r.tag_id);
  const { data: tags } = tagIds.length
    ? await supabase.from("tags").select("id,name").in("id", tagIds)
    : { data: [] };

  // Yorumlar + yazar adları
  const { data: commentRows } = await supabase
    .from("comments")
    .select("id,content,created_at,user_id")
    .eq("note_id", id)
    .order("created_at", { ascending: false });

  const authorIds = [...new Set((commentRows ?? []).map((c) => c.user_id))];
  const { data: authors } = authorIds.length
    ? await supabase.from("users").select("id,name").in("id", authorIds)
    : { data: [] };
  const nameById = new Map((authors ?? []).map((a) => [a.id, a.name]));

  const comments: CommentItem[] = (commentRows ?? []).map((c) => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    authorId: c.user_id,
    authorName: nameById.get(c.user_id) ?? "Kullanıcı",
  }));

  // Beğeni / beğenmeme / kaydetme durumu
  let liked = false;
  let disliked = false;
  let saved = false;
  if (user) {
    const [likeRes, dislikeRes, saveRes] = await Promise.all([
      supabase
        .from("likes")
        .select("id")
        .eq("user_id", user.id)
        .eq("note_id", id)
        .maybeSingle(),
      supabase
        .from("dislikes")
        .select("id")
        .eq("user_id", user.id)
        .eq("note_id", id)
        .maybeSingle(),
      supabase
        .from("saves")
        .select("id")
        .eq("user_id", user.id)
        .eq("note_id", id)
        .maybeSingle(),
    ]);
    liked = !!likeRes.data;
    disliked = !!dislikeRes.data;
    saved = !!saveRes.data;
  }

  // İlgili notlar (aynı dersten, bu not hariç)
  const { data: relatedRows } = note.course_id
    ? await supabase
        .from("notes")
        .select("*")
        .eq("course_id", note.course_id)
        .neq("id", note.id)
        .order("likes", { ascending: false })
        .limit(3)
    : { data: [] };
  const relatedNotes = (relatedRows ?? []).map(mapNoteRow);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <nav className="text-sm text-muted">
        <Link href="/notes" className="hover:text-primary">
          Keşfet
        </Link>
        {course && (
          <>
            {" / "}
            <Link href={`/courses/${course.id}`} className="hover:text-primary">
              {course.name}
            </Link>
          </>
        )}
      </nav>

      <div className="rounded-2xl border border-border bg-card p-6">
        <span
          className={
            note.type === "exam"
              ? "rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent"
              : "rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary"
          }
        >
          {note.type === "exam" ? "Sınav Sorusu" : "Ders Notu"}
        </span>
        <h1 className="mt-3 font-heading text-2xl font-bold text-card-foreground">
          {note.title}
        </h1>
        {uploader && (
          <p className="mt-1 text-sm text-muted">
            Paylaşan:{" "}
            <Link
              href={`/users/${uploader.id}`}
              className="text-primary hover:underline"
            >
              {uploader.name}
            </Link>
          </p>
        )}
        {note.description && (
          <p className="mt-2 text-muted">{note.description}</p>
        )}

        {(tags ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(tags ?? []).map((t) => (
              <Link
                key={t.id}
                href={`/tags/${t.id}`}
                className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20"
              >
                #{t.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <VoteButtons
            noteId={note.id}
            userId={user?.id ?? null}
            initialLiked={liked}
            initialDisliked={disliked}
            initialLikes={note.likes}
            initialDislikes={note.dislikes ?? 0}
            isOwner={!!user && user.id === note.user_id}
          />
          <DownloadButton
            noteId={note.id}
            fileUrl={note.file_url}
            fileName={`${note.title}.pdf`}
            initialCount={note.downloads}
            showAd={!user || !isPaid(user.plan)}
          />
          <FavoriteButton
            noteId={note.id}
            userId={user?.id ?? null}
            initialSaved={saved}
          />
        </div>

        <a
          href={note.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          PDF&apos;i Görüntüle
        </a>

        <AiSummary noteId={note.id} isPro={user?.plan === "pro"} title={note.title} />

        <div className="mt-4 border-t border-border pt-3">
          <ReportButton noteId={note.id} userId={user?.id ?? null} />
        </div>
      </div>

      <AdSlot show={!user || !isPaid(user.plan)} />

      <AiTools noteId={note.id} isPro={user?.plan === "pro"} />

      {relatedNotes.length > 0 && (
        <section>
          <h2 className="font-heading text-xl text-foreground">İlgili Notlar</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relatedNotes.map((n) => (
              <NoteCard
                key={n.id}
                note={n}
                userId={user?.id ?? null}
                isPro={user?.plan === "pro"}
              />
            ))}
          </div>
        </section>
      )}

      <CommentSection
        noteId={note.id}
        userId={user?.id ?? null}
        userName={user?.name ?? "Kullanıcı"}
        initialComments={comments}
      />
    </div>
  );
}
