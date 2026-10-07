import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookmarkSimple,
  Books,
  ChatCircle,
  DownloadSimple,
  FileText,
  Flame,
  Gift,
  GraduationCap,
  PencilSimple,
  Robot,
  Star,
  ThumbsUp,
  Trophy,
} from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { checkReferralReward } from "@/lib/actions/referral";
import { getCurrentUser } from "@/lib/supabase/auth";
import { EmptyState } from "@/components/ui/EmptyState";
import { badgeCatalog, computePoints, levelProgress } from "@/lib/contribution";
import { InviteLink } from "@/components/referral/InviteLink";

const TABS = [
  { key: "notlar", label: "Notlarım", icon: FileText },
  { key: "favoriler", label: "Favoriler", icon: BookmarkSimple },
  { key: "aktivite", label: "Yorumlarım", icon: ChatCircle },
] as const;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const requested = (await searchParams).tab;
  const tab = TABS.some((t) => t.key === requested)
    ? (requested as (typeof TABS)[number]["key"])
    : "notlar";

  const supabase = await createClient();

  const [
    { data: myNotes },
    { count: coursesAdded },
    { count: referralsMade },
    { data: saveRows },
    { data: me },
    { count: commentsCount },
    { count: savedAnswers },
    uniRes,
    depRes,
    reward,
  ] = await Promise.all([
    supabase
      .from("notes")
      .select("id,title,type,likes,downloads,created_at,course_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("created_by", user.id),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", user.id),
    supabase.from("saves").select("note_id").eq("user_id", user.id),
    supabase.from("users").select("streak_count,created_at").eq("id", user.id).maybeSingle(),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("ai_saved_answers").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    user.universityId
      ? supabase.from("universities").select("name").eq("id", user.universityId).single()
      : Promise.resolve({ data: null }),
    user.departmentId
      ? supabase.from("departments").select("name").eq("id", user.departmentId).single()
      : Promise.resolve({ data: null }),
    checkReferralReward(),
  ]);

  const notes = myNotes ?? [];
  const stats = {
    notesCount: notes.length,
    likesReceived: notes.reduce((s, n) => s + (n.likes ?? 0), 0),
    downloadsReceived: notes.reduce((s, n) => s + (n.downloads ?? 0), 0),
    coursesAdded: coursesAdded ?? 0,
    referralsMade: referralsMade ?? 0,
  };
  const points = computePoints(stats);
  const lv = levelProgress(points);
  const badges = badgeCatalog(stats);
  const earned = badges.filter((b) => b.earned).length;
  const streak = me?.streak_count ?? 0;
  const joined = me?.created_at
    ? new Date(me.created_at).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })
    : null;

  // Sekme içerikleri (yalnızca seçilen sekme için sorgu)
  const savedIds = (saveRows ?? []).map((s) => s.note_id);
  const favNotes =
    tab === "favoriler" && savedIds.length
      ? ((await supabase.from("notes").select("id,title,type,likes").in("id", savedIds)).data ?? [])
      : [];
  const myComments =
    tab === "aktivite"
      ? ((
          await supabase
            .from("comments")
            .select("id,content,created_at,note_id")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20)
        ).data ?? [])
      : [];
  const commentNoteIds = [...new Set(myComments.map((c) => c.note_id))];
  const commentNotes = commentNoteIds.length
    ? ((await supabase.from("notes").select("id,title").in("id", commentNoteIds)).data ?? [])
    : [];
  const noteTitle = new Map(commentNotes.map((n) => [n.id, n.title]));

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toLocaleUpperCase("tr"))
    .join("");

  return (
    <div className="space-y-6">
      {/* Kapak + kimlik */}
      <section className="overflow-hidden rounded-3xl border border-border bg-card">
        <div className="h-24 bg-[radial-gradient(120%_140%_at_0%_0%,color-mix(in_oklab,var(--primary)_35%,transparent),transparent_60%),radial-gradient(120%_140%_at_100%_100%,color-mix(in_oklab,var(--accent)_25%,transparent),transparent_60%)]" />
        <div className="px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-2xl border-4 border-card object-cover"
                />
              ) : (
                <div className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-card bg-primary font-heading text-2xl font-bold text-primary-foreground">
                  {initials || "?"}
                </div>
              )}
              <div className="pb-1">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-card-foreground">{user.name}</h1>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted">
                  <GraduationCap size={15} weight="duotone" className="text-primary" />
                  {uniRes.data?.name ?? "Üniversite belirtilmedi"}
                  {depRes.data?.name ? ` · ${depRes.data.name}` : ""}
                  {user.classYear ? ` · ${user.classYear}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/profile/edit"
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary"
              >
                <PencilSimple size={15} /> Düzenle
              </Link>
              <Link
                href={`/users/${user.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm text-foreground transition hover:border-primary hover:text-primary"
              >
                Herkese açık profil
              </Link>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-primary/15 px-3 py-1 font-medium text-primary">
              {user.plan === "pro" ? "🚀 Pro" : user.plan === "premium" ? "⭐ Premium" : "Ücretsiz plan"}
            </span>
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1 font-medium text-accent">
                <Flame size={13} weight="fill" /> {streak} günlük seri
              </span>
            )}
            {joined && <span className="rounded-full bg-border/60 px-3 py-1 text-muted">{joined}&apos;den beri üye</span>}
          </div>

          {/* Seviye ilerlemesi */}
          <div className="mt-5 rounded-2xl border border-border bg-background/40 p-4">
            <div className="flex items-baseline justify-between">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                <Trophy size={18} weight="duotone" className="text-accent" /> {lv.level}
              </span>
              <span className="font-heading text-2xl font-bold tabular-nums text-foreground">
                {points} <span className="text-sm font-normal text-muted">puan</span>
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${lv.pct}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {lv.next ? `${lv.next} seviyesine ${lv.toNext} puan kaldı` : "En yüksek seviyedesin 🎉"} · Not yükle +10,
              beğeni +5, ders ekle +5, davet +15
            </p>
          </div>
        </div>
      </section>

      {/* İstatistikler */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { v: stats.notesCount, l: "Yüklenen not", i: FileText },
          { v: stats.likesReceived, l: "Alınan beğeni", i: ThumbsUp },
          { v: stats.downloadsReceived, l: "İndirilme", i: DownloadSimple },
          { v: stats.coursesAdded, l: "Eklenen ders", i: Books },
          { v: commentsCount ?? 0, l: "Yorum", i: ChatCircle },
          { v: savedAnswers ?? 0, l: "Kayıtlı AI cevabı", i: Robot },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-4">
            <s.i size={20} weight="duotone" className="text-primary" />
            <div className="mt-2 font-heading text-2xl font-bold tabular-nums text-foreground">{s.v}</div>
            <div className="text-xs text-muted">{s.l}</div>
          </div>
        ))}
      </section>

      {/* Rozetler */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-card-foreground">
          <Star size={20} weight="duotone" className="text-accent" /> Rozetler
          <span className="text-sm font-normal text-muted">
            {earned}/{badges.length}
          </span>
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {badges.map((b) => (
            <div
              key={b.label}
              title={b.earned ? `${b.label} — kazanıldı` : `${b.hint} (${b.progress[0]}/${b.progress[1]})`}
              className={`flex flex-col items-center rounded-xl border p-3 text-center ${
                b.earned ? "border-accent/40 bg-accent/5" : "border-border opacity-60"
              }`}
            >
              <span className={`text-2xl ${b.earned ? "" : "grayscale"}`}>{b.icon}</span>
              <span className="mt-1 text-xs font-medium text-foreground">{b.label}</span>
              {b.earned ? (
                <span className="text-[10px] text-accent">Kazanıldı</span>
              ) : (
                <span className="text-[10px] text-muted">
                  {b.hint} · {b.progress[0]}/{b.progress[1]}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Davet */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-card-foreground">
          <Gift size={20} weight="duotone" className="text-primary" /> Arkadaşını Davet Et
        </h2>
        <p className="mt-1 text-sm text-muted">
          Her davet <b>15 puan</b>. Şu ana kadar <b>{stats.referralsMade}</b> kişi davet ettin.
        </p>
        <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
          {reward.granted ? (
            <p className="flex items-center gap-1.5 text-sm font-medium text-accent">
              <Gift size={16} weight="fill" /> {reward.required} davet ödülünü kazandın — 1 ay Premium aktif!
            </p>
          ) : (
            <>
              <p className="text-sm text-foreground">
                <b>{reward.required} arkadaş</b> davet et, <b>1 ay Premium</b> kazan.
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (reward.count / reward.required) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-muted">
                {Math.min(reward.count, reward.required)}/{reward.required} davet
              </p>
            </>
          )}
        </div>
        <div className="mt-4">
          <InviteLink userId={user.id} />
        </div>
      </section>

      {/* Sekmeler */}
      <section>
        <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/profile?tab=${t.key}`}
              scroll={false}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm transition ${
                tab === t.key ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              <t.icon size={16} weight={tab === t.key ? "fill" : "regular"} /> {t.label}
              {t.key === "notlar" && <span className="text-xs opacity-80">{notes.length}</span>}
              {t.key === "favoriler" && <span className="text-xs opacity-80">{savedIds.length}</span>}
            </Link>
          ))}
        </div>

        <div className="mt-4">
          {tab === "notlar" &&
            (notes.length === 0 ? (
              <EmptyState
                icon="📄"
                title="Henüz not yüklemedin"
                description="İlk notunu paylaş, puan ve rozet kazanmaya başla."
                action={{ href: "/notes/upload", label: "İlk Notunu Yükle" }}
              />
            ) : (
              <ul className="space-y-2">
                {notes.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/notes/${n.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary/50"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            n.type === "exam" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
                          }`}
                        >
                          {n.type === "exam" ? "Sınav" : "Not"}
                        </span>
                        <span className="truncate text-foreground">{n.title}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3 text-xs text-muted">
                        <span className="inline-flex items-center gap-1">
                          <ThumbsUp size={13} /> {n.likes}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <DownloadSimple size={13} /> {n.downloads}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "favoriler" &&
            (favNotes.length === 0 ? (
              <EmptyState
                icon="🔖"
                title="Henüz kaydettiğin not yok"
                description="Notlardaki Kaydet butonuyla favorilerine ekle, buradan kolayca ulaş."
                action={{ href: "/notes", label: "Notları Keşfet" }}
              />
            ) : (
              <ul className="space-y-2">
                {favNotes.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/notes/${n.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary/50"
                    >
                      <span className="truncate text-foreground">{n.title}</span>
                      <span className="shrink-0 text-xs text-muted">{n.type === "exam" ? "Sınav" : "Not"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}

          {tab === "aktivite" &&
            (myComments.length === 0 ? (
              <EmptyState
                icon="💬"
                title="Henüz yorum yapmadın"
                description="Notlara yorum yaz, paylaşanlara teşekkür et ya da soru sor."
                action={{ href: "/notes", label: "Notları Keşfet" }}
              />
            ) : (
              <ul className="space-y-2">
                {myComments.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/notes/${c.note_id}`}
                      className="block rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary/50"
                    >
                      <p className="line-clamp-2 text-sm text-foreground">{c.content}</p>
                      <p className="mt-1 text-xs text-muted">
                        {noteTitle.get(c.note_id) ?? "Not"} · {new Date(c.created_at).toLocaleDateString("tr-TR")}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
        </div>
      </section>
    </div>
  );
}
