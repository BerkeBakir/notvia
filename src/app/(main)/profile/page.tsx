import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, Gift } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { checkReferralReward } from "@/lib/actions/referral";
import { getCurrentUser, isProfileComplete } from "@/lib/supabase/auth";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  computeBadges,
  computeLevel,
  computePoints,
} from "@/lib/contribution";
import { InviteLink } from "@/components/referral/InviteLink";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

  // Kullanıcının notları
  const { data: myNotes } = await supabase
    .from("notes")
    .select("id,title,type,likes,downloads")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const notes = myNotes ?? [];
  const likesReceived = notes.reduce((sum, n) => sum + (n.likes ?? 0), 0);
  const downloadsReceived = notes.reduce(
    (sum, n) => sum + (n.downloads ?? 0),
    0,
  );

  const { count: coursesAdded } = await supabase
    .from("courses")
    .select("id", { count: "exact", head: true })
    .eq("created_by", user.id);

  const { count: referralsMade } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  const stats = {
    notesCount: notes.length,
    likesReceived,
    downloadsReceived,
    coursesAdded: coursesAdded ?? 0,
    referralsMade: referralsMade ?? 0,
  };
  const points = computePoints(stats);
  const level = computeLevel(points);
  const badges = computeBadges(stats);

  // Favoriler
  const { data: saveRows } = await supabase
    .from("saves")
    .select("note_id")
    .eq("user_id", user.id);
  const savedIds = (saveRows ?? []).map((s) => s.note_id);
  const { data: favNotes } = savedIds.length
    ? await supabase
        .from("notes")
        .select("id,title,type")
        .in("id", savedIds)
    : { data: [] };

  // Üniversite / bölüm adı
  const [uniRes, depRes] = await Promise.all([
    user.universityId
      ? supabase
          .from("universities")
          .select("name")
          .eq("id", user.universityId)
          .single()
      : Promise.resolve({ data: null }),
    user.departmentId
      ? supabase
          .from("departments")
          .select("name")
          .eq("id", user.departmentId)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  const { data: streakRow } = await supabase
    .from("users")
    .select("streak_count")
    .eq("id", user.id)
    .maybeSingle();
  const streak = streakRow?.streak_count ?? 0;
  const reward = await checkReferralReward();

  return (
    <div className="space-y-8">
      {!isProfileComplete(user) && (
        <div className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent">
          Profilin eksik.{" "}
          <Link href="/profile/edit" className="font-medium underline">
            Tamamla
          </Link>
        </div>
      )}

      {/* Üst kart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-card-foreground">
              {user.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {uniRes.data?.name ?? "Üniversite belirtilmedi"}
              {depRes.data?.name ? ` · ${depRes.data.name}` : ""}
              {user.classYear ? ` · ${user.classYear}` : ""}
            </p>
            <span className="mt-2 inline-block rounded-full bg-primary/15 px-3 py-0.5 text-xs font-medium text-primary">
              {user.plan === "pro"
                ? "🚀 Pro"
                : user.plan === "premium"
                  ? "⭐ Premium"
                  : "Ücretsiz"}
            </span>
          </div>
          <div className="text-right">
            <div className="font-heading text-3xl font-bold text-foreground">
              {points}
            </div>
            <div className="text-sm text-muted">puan · {level}</div>
            {streak > 0 && (
              <div className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-accent">
                <Flame size={15} weight="fill" /> {streak} günlük seri
              </div>
            )}
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Link
                href="/kaydedilenler"
                className="inline-block rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary"
              >
                Kaydedilenler
              </Link>
              <Link
                href="/profile/edit"
                className="inline-block rounded-full border border-border px-4 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary"
              >
                Profili Düzenle
              </Link>
            </div>
          </div>
        </div>

        {/* Rozetler */}
        <div className="mt-5 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b.label}
              className="rounded-full border border-border bg-background/40 px-3 py-1 text-sm text-foreground"
            >
              {b.icon} {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { value: stats.notesCount, label: "Yüklenen not" },
          { value: stats.likesReceived, label: "Alınan beğeni" },
          { value: stats.downloadsReceived, label: "İndirilme" },
          { value: stats.coursesAdded, label: "Eklenen ders" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card p-4 text-center"
          >
            <div className="font-heading text-2xl font-bold text-foreground">
              {s.value}
            </div>
            <div className="mt-1 text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Davet et */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-1.5 font-heading text-lg text-card-foreground">
          <Gift size={20} weight="duotone" className="text-primary" /> Arkadaşını Davet Et
        </h2>
        <p className="mt-1 text-sm text-muted">
          Davet linkinle gelen her arkadaş için <b>15 puan</b> kazan. Şu ana
          kadar <b>{stats.referralsMade}</b> kişi davet ettin.
        </p>

        {/* Ödül: 5 davet → 1 ay Premium */}
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4">
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
      </div>

      {/* Yüklediğim notlar */}
      <section>
        <h2 className="font-heading text-xl text-foreground">
          Yüklediğim Notlar
        </h2>
        {notes.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon="📄"
            title="Henüz not yüklemedin"
            description="İlk notunu paylaş, puan ve rozet kazanmaya başla."
            action={{ href: "/notes/upload", label: "İlk Notunu Yükle" }}
          />
        ) : (
          <ul className="mt-4 space-y-2">
            {notes.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/notes/${n.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/50"
                >
                  <span className="text-foreground">{n.title}</span>
                  <span className="text-xs text-muted">
                    ♥ {n.likes} · ↓ {n.downloads}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Favoriler */}
      <section>
        <h2 className="font-heading text-xl text-foreground">Favorilerim</h2>
        {(favNotes ?? []).length === 0 ? (
          <EmptyState
            className="mt-4"
            icon="⭐"
            title="Henüz kaydettiğin not yok"
            description="Beğendiğin notları favorilere ekle, buradan kolayca ulaş."
            action={{ href: "/notes", label: "Notları Keşfet" }}
          />
        ) : (
          <ul className="mt-4 space-y-2">
            {(favNotes ?? []).map((n) => (
              <li key={n.id}>
                <Link
                  href={`/notes/${n.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 hover:border-primary/50"
                >
                  <span className="text-foreground">{n.title}</span>
                  <span className="text-xs text-muted">
                    {n.type === "exam" ? "Sınav" : "Not"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
