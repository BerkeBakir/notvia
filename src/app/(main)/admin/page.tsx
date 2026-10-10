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

  const { data: interest } = await admin
    .from("premium_interest")
    .select("answer,plan,max_price,wants,updated_at")
    .order("updated_at", { ascending: false });
  const interestRows = interest ?? [];
  const tally = (key: "answer" | "plan" | "max_price") =>
    interestRows.reduce<Record<string, number>>((acc, r) => {
      const v = r[key] ?? "—";
      acc[v] = (acc[v] ?? 0) + 1;
      return acc;
    }, {});

  const { data: reports } = await admin
    .from("reports")
    .select("id,note_id,user_id,reason,created_at")
    .order("created_at", { ascending: false });

  const reportList = reports ?? [];
  const noteIds = [...new Set(reportList.map((r) => r.note_id).filter(Boolean))];
  const userIds = [...new Set(reportList.map((r) => r.user_id).filter(Boolean))];

  const [{ data: notes }, { data: reporters }] = await Promise.all([
    noteIds.length
      ? admin.from("notes").select("id,title,hidden_at").in("id", noteIds)
      : Promise.resolve({ data: [] as { id: string; title: string; hidden_at: string | null }[] }),
    userIds.length
      ? admin.from("users").select("id,name").in("id", userIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const reporterName = new Map((reporters ?? []).map((u) => [u.id, u.name]));
  // Şikayetleri nota göre grupla; gizlenmiş (onay bekleyen) notlar en üstte
  const groups = (notes ?? [])
    .map((n) => ({ note: n, reports: reportList.filter((r) => r.note_id === n.id) }))
    .sort((x, y) => Number(!!y.note.hidden_at) - Number(!!x.note.hidden_at) || y.reports.length - x.reports.length);
  const topReason = (rs: { reason: string }[]) => {
    const c = new Map<string, number>();
    for (const r of rs) c.set(r.reason, (c.get(r.reason) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  };
  const pendingCount = groups.filter((g) => g.note.hidden_at).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          🛡️ Moderasyon Paneli
        </h1>
        <p className="mt-1 text-sm text-muted">
          Şikayet edilen notlar: {groups.length} · onay bekleyen (otomatik gizlenen): {pendingCount}. 3 farklı kişi
          şikayet edince not otomatik gizlenir.
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="text-muted">Bekleyen şikayet yok. 🎉</p>
      ) : (
        <ul className="space-y-3">
          {groups.map(({ note, reports: rs }) => (
            <li
              key={note.id}
              className={`rounded-2xl border bg-card p-5 ${note.hidden_at ? "border-red-500/50" : "border-border"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-card-foreground">
                    <Link href={`/notes/${note.id}`} className="hover:text-primary">
                      {note.title}
                    </Link>
                    {note.hidden_at && (
                      <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-400">
                        Gizlendi · onay bekliyor
                      </span>
                    )}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {rs.map((r) => (
                      <li key={r.id} className="text-xs text-muted">
                        <span className="text-red-400">⚑ {r.reason}</span> · {reporterName.get(r.user_id ?? "") ?? "Anonim"} ·{" "}
                        {new Date(r.created_at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })}
                      </li>
                    ))}
                  </ul>
                </div>
                <ModerationActions noteId={note.id} hidden={!!note.hidden_at} defaultReason={topReason(rs)} />
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

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          💳 Premium ilgi anketi ({interestRows.length} cevap)
        </h2>
        {interestRows.length === 0 ? (
          <p className="text-muted">Henüz cevap yok.</p>
        ) : (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5 text-sm">
            {(
              [
                ["Alır mıydın", "answer"],
                ["Plan", "plan"],
                ["Aylık bütçe (₺)", "max_price"],
              ] as const
            ).map(([label, key]) => (
              <p key={key} className="text-card-foreground">
                <span className="text-muted">{label}:</span>{" "}
                {Object.entries(tally(key))
                  .map(([k, v]) => `${k} ${v}`)
                  .join(" · ")}
              </p>
            ))}
            <ul className="space-y-1 border-t border-border pt-3 text-muted">
              {interestRows
                .filter((r) => r.wants)
                .map((r, i) => (
                  <li key={i}>
                    <span className="text-foreground">{r.answer}:</span> {r.wants}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
