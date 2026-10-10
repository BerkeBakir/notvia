import Link from "next/link";
import { Eye } from "@phosphor-icons/react/dist/ssr";
import type { Note } from "@/types";
import { LikeButton } from "@/components/notes/LikeButton";
import { DownloadButton } from "@/components/notes/DownloadButton";
import { AiSummary } from "@/components/notes/AiSummary";
import { computeRating } from "@/lib/rating";
import { CommunityBadge } from "@/components/notes/CommunityBadge";

export function NoteCard({
  note,
  userId = null,
  liked = false,
  locked = false,
  isPro = false,
}: {
  note: Note;
  userId?: string | null;
  liked?: boolean;
  locked?: boolean;
  isPro?: boolean;
}) {
  const rating = computeRating(note.likes, note.dislikes);

  if (locked) {
    return (
      <article className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5">
        <span className="w-fit rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
          ⭐ Premium
        </span>
        <h3 className="mt-3 select-none font-heading text-lg text-card-foreground blur-sm">
          {note.title}
        </h3>
        <p className="mt-1 select-none text-sm text-muted blur-sm">
          En çok beğenilen notlardan biri
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted">
          🔒 Bu içerik Premium üyelere özel
        </div>
        <Link
          href="/premium"
          className="mt-4 inline-block rounded-lg border border-primary px-4 py-2 text-center text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground"
        >
          Premium ile Kilidi Aç
        </Link>
      </article>
    );
  }

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-5 transition hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
      <span
        className={
          note.type === "exam"
            ? "w-fit rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent"
            : "w-fit rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary"
        }
      >
        {note.type === "exam" ? "Sınav Sorusu" : "Ders Notu"}
      </span>
      <div className="mt-2">
        <CommunityBadge likes={note.likes} dislikes={note.dislikes} />
      </div>
      <div className="mt-1 flex items-start justify-between gap-2">
        <h3 className="font-heading text-lg text-card-foreground">
          <Link href={`/notes/${note.id}`} className="hover:text-primary">
            {note.title}
          </Link>
        </h3>
        {rating !== null && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-foreground">
            <span className="text-accent">★</span> {rating.toFixed(1)}
            <span className="text-muted">({note.likes + note.dislikes})</span>
          </span>
        )}
      </div>
      {note.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted">
          {note.description}
        </p>
      )}
      <div className="mt-4 flex items-center gap-2">
        <LikeButton
          noteId={note.id}
          userId={userId}
          initialLiked={liked}
          initialCount={note.likes}
          isOwner={!!userId && userId === note.userId}
        />
        {note.fileUrl && (
          <DownloadButton
            noteId={note.id}
            fileUrl={note.fileUrl}
            fileName={`${note.title}.pdf`}
            initialCount={note.downloads}
          />
        )}
      </div>
      {note.fileUrl && (
        <a
          href={note.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Eye size={16} weight="bold" /> PDF&apos;i Görüntüle
        </a>
      )}
      {note.fileUrl && <AiSummary noteId={note.id} isPro={isPro} title={note.title} />}
    </article>
  );
}
