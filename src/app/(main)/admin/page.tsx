import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser, isModerator } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ModerationActions } from "@/components/admin/ModerationActions";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !isModerator(user)) notFound();

  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Sunucu yapılandırılmamış (service key yok).</p>;
  }

  const { data: reports } = await admin
    .from("reports")
    .select("id,note_id,user_id,reason,created_at")
    .order("created_at", { ascending: false });

  const reportList = reports ?? [];
  const noteIds = [...new Set(reportList.map((r) => r.note_id).filter(Boolean))];
  const userIds = [...new Set(reportList.map((r) => r.user_id).filter(Boolean))];

  const [{ data: notes }, { data: reporters }] = await Promise.all([
    noteIds.length
      ? admin.from("notes").select("id,title").in("id", noteIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    userIds.length
      ? admin.from("users").select("id,name").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const noteTitle = new Map((notes ?? []).map((n) => [n.id, n.title]));
  const reporterName = new Map((reporters ?? []).map((u) => [u.id, u.name]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          🛡️ Moderasyon Paneli
        </h1>
        <p className="mt-1 text-sm text-muted">
          Şikayet edilen içerikler. ({reportList.length} açık şikayet)
        </p>
      </div>

      {reportList.length === 0 ? (
        <p className="text-muted">Bekleyen şikayet yok. 🎉</p>
      ) : (
        <ul className="space-y-3">
          {reportList.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-card-foreground">
                    {r.note_id ? (
                      <Link
                        href={`/notes/${r.note_id}`}
                        className="hover:text-primary"
                      >
                        {noteTitle.get(r.note_id) ?? "(silinmiş not)"}
                      </Link>
                    ) : (
                      "(not yok)"
                    )}
                  </p>
                  <p className="mt-1 text-sm text-red-400">⚑ {r.reason}</p>
                  <p className="mt-1 text-xs text-muted">
                    {reporterName.get(r.user_id ?? "") ?? "Anonim"} ·{" "}
                    {new Date(r.created_at).toLocaleString("tr-TR")}
                  </p>
                </div>
                <ModerationActions noteId={r.note_id} reportId={r.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
