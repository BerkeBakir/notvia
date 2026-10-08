import { redirect } from "next/navigation";
import Link from "next/link";
import { BookmarkSimple, Trash, LinkSimple } from "@phosphor-icons/react/dist/ssr";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Markdown } from "@/components/ai/Markdown";
import { deleteSavedAnswer } from "@/lib/actions/savedAnswers";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShareToFriend } from "@/components/friends/ShareToFriend";

export const metadata = {
  title: "Kaydedilenler",
  description: "Kaydettiğin AI çalışma cevapları.",
};

type Saved = {
  id: string;
  content: string;
  sources: { noteId: string }[] | null;
  created_at: string;
  shared_by: string | null;
};

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/kaydedilenler");

  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_saved_answers")
    .select("id,content,sources,created_at,shared_by")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const items = (data ?? []) as Saved[];
  const senderIds = [...new Set(items.map((i) => i.shared_by).filter(Boolean))] as string[];
  const { data: senders } = senderIds.length
    ? await supabase.from("users").select("id,name").in("id", senderIds)
    : { data: [] as { id: string; name: string }[] };
  const senderName = new Map((senders ?? []).map((u) => [u.id, u.name]));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-2">
        <BookmarkSimple size={24} weight="duotone" className="text-primary" />
        <h1 className="font-heading text-2xl font-bold text-foreground">Kaydedilenler</h1>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="📄"
          title="Henüz kayıt yok"
          description="Asistandaki bir cevabın altındaki Kaydet'e basarak buraya ekleyebilirsin."
          action={{ href: "/asistan", label: "Asistana Git" }}
        />
      ) : (
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  {new Date(it.created_at).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                  {it.shared_by && (
                    <Link
                      href={`/users/${it.shared_by}`}
                      className="rounded-full bg-primary/15 px-2 py-0.5 font-medium text-primary hover:underline"
                    >
                      📨 {senderName.get(it.shared_by) ?? "Arkadaşın"} gönderdi
                    </Link>
                  )}
                </span>
                <span className="flex items-center gap-3">
                <ShareToFriend userId={user.id} answerId={it.id} compact />
                <form action={deleteSavedAnswer.bind(null, it.id)}>
                  <button
                    type="submit"
                    aria-label="Sil"
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-red-400"
                  >
                    <Trash size={14} /> Sil
                  </button>
                </form>
                </span>
              </div>
              <Markdown text={it.content} />
              {it.sources && it.sources.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-2">
                  {[...new Set(it.sources.map((s) => s.noteId))].map((noteId, j) => (
                    <Link
                      key={noteId}
                      href={`/notes/${noteId}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <LinkSimple size={12} /> Kaynak {j + 1}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
