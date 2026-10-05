import { redirect } from "next/navigation";
import Link from "next/link";
import { BookmarkSimple, Trash, LinkSimple } from "@phosphor-icons/react/dist/ssr";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { Markdown } from "@/components/ai/Markdown";
import { deleteSavedAnswer } from "@/lib/actions/savedAnswers";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Kaydedilenler",
  description: "Kaydettiğin AI çalışma cevapları.",
};

type Saved = {
  id: string;
  content: string;
  sources: { noteId: string }[] | null;
  created_at: string;
};

export default async function SavedPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/kaydedilenler");

  const supabase = await createClient();
  const { data } = await supabase
    .from("ai_saved_answers")
    .select("id,content,sources,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const items = (data ?? []) as Saved[];

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
                <span className="text-xs text-muted">
                  {new Date(it.created_at).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <form action={deleteSavedAnswer.bind(null, it.id)}>
                  <button
                    type="submit"
                    aria-label="Sil"
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-red-400"
                  >
                    <Trash size={14} /> Sil
                  </button>
                </form>
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
