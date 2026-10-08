import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser, isModerator } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ModerationActions } from "@/components/admin/ModerationActions";
import { FeedbackStatus } from "@/components/admin/FeedbackStatus";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || !isModerator(user)) notFound();

  const admin = createAdminClient();
  if (!admin) {
    return <p className="text-muted">Sunucu yapılandırılmamış (service key yok).</p>;
  }

  const { data: feedback } = await admin
    .from("feedback")
    .select("id,kind,message,contact,page,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

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
                    {new Date(r.created_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
                  </p>
                </div>
                <ModerationActions noteId={r.note_id} reportId={r.id} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="space-y-3 pt-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">
          💬 Geri bildirimler{" "}
          <span className="text-base font-normal text-muted">
            ({(feedback ?? []).filter((f) => f.status === "yeni").length} yeni)
          </span>
        </h2>
        {(feedback ?? []).length === 0 ? (
          <p className="text-muted">Henüz geri bildirim yok.</p>
        ) : (
          <ul className="space-y-3">
            {(feedback ?? []).map((f) => (
              <li
                key={f.id}
                className={`rounded-2xl border bg-card p-5 ${f.status === "yeni" ? "border-primary/40" : "border-border opacity-80"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">
                      {{ oneri: "💡 Öneri", soru: "❓ Soru", hata: "🐞 Hata", diger: "Diğer" }[f.kind as string] ?? f.kind}
                    </span>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-card-foreground">{f.message}</p>
                    <p className="mt-2 text-xs text-muted">
                      {f.contact ?? "iletişim yok"} · {f.page ?? "-"} ·{" "}
                      {new Date(f.created_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
                    </p>
                  </div>
                  <FeedbackStatus id={f.id} status={f.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
