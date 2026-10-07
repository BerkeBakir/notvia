import Link from "next/link";
import { redirect } from "next/navigation";
import { MagnifyingGlass, Newspaper, UserPlus, Users } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { mapNoteRow } from "@/lib/supabase/mappers";
import { NoteCard } from "@/components/notes/NoteCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FollowButton } from "@/components/friends/FollowButton";
import { InviteLink } from "@/components/referral/InviteLink";

export const metadata = { title: "Arkadaşlar" };

const TABS = [
  { key: "akis", label: "Arkadaşlarından", icon: Newspaper },
  { key: "liste", label: "Arkadaşlarım", icon: Users },
  { key: "bul", label: "Arkadaş bul", icon: UserPlus },
] as const;

type U = { id: string; name: string; university_id: string | null; department_id: string | null; class_year: string | null };

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/arkadaslar");
  const sp = await searchParams;
  const tab = (TABS.some((t) => t.key === sp.tab) ? sp.tab : "akis") as (typeof TABS)[number]["key"];

  const supabase = await createClient();
  const [{ data: out }, { data: inc }] = await Promise.all([
    supabase.from("follows").select("following_id").eq("follower_id", user.id),
    supabase.from("follows").select("follower_id").eq("following_id", user.id),
  ]);
  const followingIds = new Set((out ?? []).map((r) => r.following_id));
  const followerIds = new Set((inc ?? []).map((r) => r.follower_id));

  const cols = "id,name,university_id,department_id,class_year";
  let feed: ReturnType<typeof mapNoteRow>[] = [];
  let people: U[] = [];
  let suggestions: U[] = [];

  if (tab === "akis" && followingIds.size) {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .in("user_id", [...followingIds])
      .order("created_at", { ascending: false })
      .limit(30);
    feed = (data ?? []).map(mapNoteRow);
  }

  if (tab === "liste") {
    const ids = [...new Set([...followingIds, ...followerIds])];
    if (ids.length) {
      const { data } = await supabase.from("users").select(cols).in("id", ids);
      people = (data ?? []) as U[];
    }
  }

  if (tab === "bul") {
    const q = (sp.q ?? "").trim().slice(0, 60);
    if (q.length >= 2) {
      const { data } = await supabase
        .from("users")
        .select(cols)
        .ilike("name", `%${q.replace(/[%_]/g, "")}%`)
        .neq("id", user.id)
        .limit(20);
      people = (data ?? []) as U[];
    }
    // Öneriler: aynı bölüm, sonra aynı üniversite
    const pick = async (col: "department_id" | "university_id", val: string | null) =>
      val
        ? (((await supabase.from("users").select(cols).eq(col, val).neq("id", user.id).limit(24)).data ?? []) as U[])
        : [];
    const sameDep = await pick("department_id", user.departmentId);
    const sameUni = await pick("university_id", user.universityId);
    const seen = new Set<string>();
    suggestions = [...sameDep, ...sameUni].filter((u) => {
      if (seen.has(u.id) || followingIds.has(u.id) || u.id === "00000000-0000-0000-0000-00000000dede") return false;
      seen.add(u.id);
      return true;
    }).slice(0, 12);
  }

  // İsim yanında gösterilecek üniversite/bölüm adları
  const all = [...people, ...suggestions];
  const uniIds = [...new Set(all.map((u) => u.university_id).filter(Boolean))] as string[];
  const depIds = [...new Set(all.map((u) => u.department_id).filter(Boolean))] as string[];
  const [{ data: unis }, { data: deps }] = await Promise.all([
    uniIds.length ? supabase.from("universities").select("id,name").in("id", uniIds) : Promise.resolve({ data: [] }),
    depIds.length ? supabase.from("departments").select("id,name").in("id", depIds) : Promise.resolve({ data: [] }),
  ]);
  const uniName = new Map((unis ?? []).map((u) => [u.id, u.name]));
  const depName = new Map((deps ?? []).map((d) => [d.id, d.name]));

  const PersonRow = ({ p }: { p: U }) => (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3">
      <Link href={`/users/${p.id}`} className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/15 font-bold text-primary">
          {p.name.slice(0, 1).toLocaleUpperCase("tr")}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-foreground hover:text-primary">{p.name}</span>
          <span className="block truncate text-xs text-muted">
            {[p.university_id && uniName.get(p.university_id), p.department_id && depName.get(p.department_id), p.class_year]
              .filter(Boolean)
              .join(" · ") || "Notvia öğrencisi"}
          </span>
        </span>
      </Link>
      <FollowButton
        targetId={p.id}
        viewerId={user.id}
        initialFollowing={followingIds.has(p.id)}
        followsYou={followerIds.has(p.id)}
        size="sm"
      />
    </li>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">Arkadaşlar</h1>
        <p className="mt-1 text-sm text-muted">
          {followingIds.size} arkadaş ekledin · {followerIds.size} kişi seni ekledi
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/arkadaslar?tab=${t.key}`}
            scroll={false}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm transition ${
              tab === t.key ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
            }`}
          >
            <t.icon size={16} weight={tab === t.key ? "fill" : "regular"} /> {t.label}
          </Link>
        ))}
      </div>

      {tab === "akis" &&
        (followingIds.size === 0 ? (
          <EmptyState
            icon="👋"
            title="Henüz arkadaş eklemedin"
            description="Arkadaşlarını ekle; yeni not paylaştıklarında burada görür, bildirim alırsın."
            action={{ href: "/arkadaslar?tab=bul", label: "Arkadaş bul" }}
          />
        ) : feed.length === 0 ? (
          <EmptyState icon="📭" title="Arkadaşların henüz not paylaşmamış" description="Paylaştıkları an burada olacak." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {feed.map((n) => (
              <NoteCard key={n.id} note={n} userId={user.id} isPro={user.plan === "pro"} />
            ))}
          </div>
        ))}

      {tab === "liste" &&
        (people.length === 0 ? (
          <EmptyState
            icon="🫂"
            title="Listen boş"
            description="Sınıf arkadaşlarını bul ya da davet linkini paylaş — davetle gelen otomatik arkadaşın olur."
            action={{ href: "/arkadaslar?tab=bul", label: "Arkadaş bul" }}
          />
        ) : (
          <div className="space-y-5">
            {[
              { title: "Arkadaşlarım", list: people.filter((p) => followingIds.has(p.id)) },
              { title: "Seni ekleyenler", list: people.filter((p) => followerIds.has(p.id) && !followingIds.has(p.id)) },
            ]
              .filter((g) => g.list.length)
              .map((g) => (
                <section key={g.title}>
                  <h2 className="mb-2 text-sm font-semibold text-muted">
                    {g.title} · {g.list.length}
                  </h2>
                  <ul className="space-y-2">
                    {g.list.map((p) => (
                      <PersonRow key={p.id} p={p} />
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        ))}

      {tab === "bul" && (
        <div className="space-y-6">
          <form className="relative" action="/arkadaslar">
            <input type="hidden" name="tab" value="bul" />
            <MagnifyingGlass size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="İsimle ara (en az 2 harf), Enter'a bas"
              className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </form>

          {sp.q && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted">Sonuçlar</h2>
              {people.length === 0 ? (
                <p className="text-sm text-muted">Bu isimle kimse bulunamadı. Davet linkini gönderebilirsin 👇</p>
              ) : (
                <ul className="space-y-2">
                  {people.map((p) => (
                    <PersonRow key={p.id} p={p} />
                  ))}
                </ul>
              )}
            </section>
          )}

          {suggestions.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-muted">Bölümünden ve üniversitenden</h2>
              <ul className="space-y-2">
                {suggestions.map((p) => (
                  <PersonRow key={p.id} p={p} />
                ))}
              </ul>
            </section>
          )}

          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg font-semibold text-card-foreground">Arkadaşın Notvia&apos;da yok mu?</h2>
            <p className="mt-1 text-sm text-muted">
              Davet linkinle kaydolan otomatik arkadaşın olur, sen de 15 puan kazanırsın.
            </p>
            <div className="mt-3">
              <InviteLink userId={user.id} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
