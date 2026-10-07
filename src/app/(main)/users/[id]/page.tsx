import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/supabase/auth";
import { FollowButton } from "@/components/friends/FollowButton";
import {
  computeBadges,
  computeLevel,
  computePoints,
} from "@/lib/contribution";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("id,name,plan,university_id,department_id,class_year")
    .eq("id", id)
    .maybeSingle();
  if (!profile) notFound();

  const { data: myNotes } = await supabase
    .from("notes")
    .select("id,title,type,likes,downloads")
    .eq("user_id", id)
    .order("created_at", { ascending: false });
  const notes = myNotes ?? [];

  const [{ count: coursesAdded }, { count: referralsMade }, uniRes, depRes] =
    await Promise.all([
      supabase
        .from("courses")
        .select("id", { count: "exact", head: true })
        .eq("created_by", id),
      supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", id),
      profile.university_id
        ? supabase.from("universities").select("name").eq("id", profile.university_id).single()
        : Promise.resolve({ data: null }),
      profile.department_id
        ? supabase.from("departments").select("name").eq("id", profile.department_id).single()
        : Promise.resolve({ data: null }),
    ]);

  const viewer = await getCurrentUser();
  const [{ count: friendCount }, rel] = await Promise.all([
    supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("follower_id", id),
    viewer && viewer.id !== id
      ? Promise.all([
          supabase.from("follows").select("follower_id").eq("follower_id", viewer.id).eq("following_id", id).maybeSingle(),
          supabase.from("follows").select("follower_id").eq("follower_id", id).eq("following_id", viewer.id).maybeSingle(),
        ])
      : Promise.resolve(null),
  ]);
  const iFollow = !!rel?.[0]?.data;
  const followsMe = !!rel?.[1]?.data;

  const stats = {
    notesCount: notes.length,
    likesReceived: notes.reduce((s, n) => s + (n.likes ?? 0), 0),
    downloadsReceived: notes.reduce((s, n) => s + (n.downloads ?? 0), 0),
    coursesAdded: coursesAdded ?? 0,
    referralsMade: referralsMade ?? 0,
  };
  const points = computePoints(stats);
  const badges = computeBadges(stats);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-card-foreground">
              {profile.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {uniRes.data?.name ?? "Üniversite belirtilmedi"}
              {depRes.data?.name ? ` · ${depRes.data.name}` : ""}
              {profile.class_year ? ` · ${profile.class_year}` : ""}
            </p>
            {profile.plan !== "free" && (
              <span className="mt-2 inline-block rounded-full bg-primary/15 px-3 py-0.5 text-xs font-medium text-primary">
                {profile.plan === "pro" ? "🚀 Pro" : "⭐ Premium"}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <div className="font-heading text-3xl font-bold text-foreground">
              {points}
            </div>
            <div className="text-sm text-muted">
              puan · {computeLevel(points)} · {friendCount ?? 0} arkadaş
            </div>
            <FollowButton targetId={id} viewerId={viewer?.id ?? null} initialFollowing={iFollow} followsYou={followsMe} />
            {followsMe && !iFollow && <span className="text-xs text-muted">Seni arkadaş olarak ekledi</span>}
          </div>
        </div>
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

      <div className="grid grid-cols-3 gap-4">
        {[
          { v: stats.notesCount, l: "Not" },
          { v: stats.likesReceived, l: "Beğeni" },
          { v: stats.downloadsReceived, l: "İndirilme" },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="font-heading text-2xl font-bold text-foreground">{s.v}</div>
            <div className="mt-1 text-xs text-muted">{s.l}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="font-heading text-xl text-foreground">Paylaştığı Notlar</h2>
        {notes.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon="📄"
            title="Henüz not paylaşmamış"
            description="Bu kullanıcı henüz içerik yüklememiş."
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
                  <span className="text-xs text-muted">♥ {n.likes} · ↓ {n.downloads}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
