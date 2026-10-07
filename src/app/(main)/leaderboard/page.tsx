import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeLevel, computePoints } from "@/lib/contribution";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCurrentUser } from "@/lib/supabase/auth";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const viewer = await getCurrentUser();
  const friendsTab = (await searchParams).tab === "arkadaslar";
  let circle: Set<string> | null = null;
  if (friendsTab && viewer) {
    const { data: fr } = await supabase.from("follows").select("following_id").eq("follower_id", viewer.id);
    circle = new Set([viewer.id, ...(fr ?? []).map((r) => r.following_id)]);
  }

  const [usersRes, notesRes, coursesRes, reqRes, questRes] = await Promise.all([
    supabase.from("users").select("id,name"),
    supabase.from("notes").select("user_id,likes,downloads"),
    supabase.from("courses").select("created_by"),
    supabase.from("note_requests").select("fulfilled_by").eq("status", "fulfilled"),
    supabase.from("weekly_quest_claims").select("user_id,points"),
  ]);

  const users = usersRes.data ?? [];
  const notes = notesRes.data ?? [];
  const courses = coursesRes.data ?? [];

  const byUser = new Map<
    string,
    { notesCount: number; likesReceived: number; downloadsReceived: number; coursesAdded: number; requestsFulfilled: number; questPoints: number }
  >();
  const ensure = (id: string) => {
    if (!byUser.has(id))
      byUser.set(id, {
        notesCount: 0,
        likesReceived: 0,
        downloadsReceived: 0,
        coursesAdded: 0,
        requestsFulfilled: 0,
        questPoints: 0,
      });
    return byUser.get(id)!;
  };

  for (const n of notes) {
    const s = ensure(n.user_id);
    s.notesCount += 1;
    s.likesReceived += n.likes ?? 0;
    s.downloadsReceived += n.downloads ?? 0;
  }
  for (const c of courses) {
    if (c.created_by) ensure(c.created_by).coursesAdded += 1;
  }
  for (const r of reqRes.data ?? []) {
    if (r.fulfilled_by) ensure(r.fulfilled_by).requestsFulfilled += 1;
  }
  for (const q of questRes.data ?? []) {
    ensure(q.user_id).questPoints += q.points ?? 0;
  }

  const ranked = users
    .map((u) => {
      const s = byUser.get(u.id) ?? {
        notesCount: 0,
        likesReceived: 0,
        downloadsReceived: 0,
        coursesAdded: 0,
        requestsFulfilled: 0,
        questPoints: 0,
      };
      return { id: u.id, name: u.name, points: computePoints(s), stats: s };
    })
    .filter((r) => (circle ? circle.has(r.id) : r.points > 0))
    .sort((a, b) => b.points - a.points)
    .slice(0, 20);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          🏆 Liderlik Tablosu
        </h1>
        <p className="mt-1 text-sm text-muted">
          En çok katkı yapan öğrenciler.
        </p>
      </div>

      <div className="flex gap-1 rounded-2xl border border-border bg-card p-1">
        {[
          ["", "Genel"],
          ["arkadaslar", "Arkadaşlar"],
        ].map(([k, l]) => (
          <Link
            key={k}
            href={k ? `/leaderboard?tab=${k}` : "/leaderboard"}
            className={`flex-1 rounded-xl px-4 py-2 text-center text-sm transition ${
              (k === "arkadaslar") === friendsTab ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            {l}
          </Link>
        ))}
      </div>

      {friendsTab && !viewer && (
        <EmptyState icon="🔒" title="Giriş yap" description="Arkadaşlarınla yarışmak için giriş yap." action={{ href: "/login", label: "Giriş Yap" }} />
      )}
      {friendsTab && viewer && circle && circle.size === 1 && (
        <EmptyState
          icon="👋"
          title="Henüz arkadaşın yok"
          description="Arkadaş ekle, aranızda kim daha çok katkı yapıyor gör."
          action={{ href: "/arkadaslar?tab=bul", label: "Arkadaş bul" }}
        />
      )}

      {friendsTab && (!viewer || (circle && circle.size === 1)) ? null : ranked.length === 0 ? (
        <EmptyState
          icon="🏆"
          title="Henüz katkı yapan kimse yok"
          description="İlk notu sen yükle, liderlik tablosunun zirvesine yerleş."
          action={{ href: "/notes/upload", label: "Not Yükle" }}
        />
      ) : (
        <ul className="space-y-2">
          {ranked.map((r, i) => (
            <li
              key={r.name + i}
              className={`flex items-center justify-between rounded-xl border bg-card px-4 py-3 ${
                r.id === viewer?.id ? "border-primary/50 ring-2 ring-primary/10" : "border-border"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-8 text-center text-lg font-bold text-muted">
                  {medals[i] ?? i + 1}
                </span>
                <div>
                  <Link
                    href={`/users/${r.id}`}
                    className="font-medium text-foreground hover:text-primary"
                  >
                    {r.name}
                  </Link>
                  <div className="text-xs text-muted">
                    {r.stats.notesCount} not · {r.stats.likesReceived} beğeni ·{" "}
                    {computeLevel(r.points)}
                  </div>
                </div>
              </div>
              <span className="font-heading text-lg font-bold text-primary">
                {r.points}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
