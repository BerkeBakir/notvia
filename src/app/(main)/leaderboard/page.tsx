import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { computeLevel, computePoints } from "@/lib/contribution";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const [usersRes, notesRes, coursesRes] = await Promise.all([
    supabase.from("users").select("id,name"),
    supabase.from("notes").select("user_id,likes,downloads"),
    supabase.from("courses").select("created_by"),
  ]);

  const users = usersRes.data ?? [];
  const notes = notesRes.data ?? [];
  const courses = coursesRes.data ?? [];

  const byUser = new Map<
    string,
    { notesCount: number; likesReceived: number; downloadsReceived: number; coursesAdded: number }
  >();
  const ensure = (id: string) => {
    if (!byUser.has(id))
      byUser.set(id, {
        notesCount: 0,
        likesReceived: 0,
        downloadsReceived: 0,
        coursesAdded: 0,
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

  const ranked = users
    .map((u) => {
      const s = byUser.get(u.id) ?? {
        notesCount: 0,
        likesReceived: 0,
        downloadsReceived: 0,
        coursesAdded: 0,
      };
      return { id: u.id, name: u.name, points: computePoints(s), stats: s };
    })
    .filter((r) => r.points > 0)
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

      {ranked.length === 0 ? (
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
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
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
