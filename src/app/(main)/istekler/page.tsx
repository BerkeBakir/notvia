import Link from "next/link";
import { HandWaving } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { loadRequests } from "@/lib/requests";
import { RequestBoard } from "@/components/requests/RequestBoard";

export const metadata = {
  title: "Not istekleri",
  description: "Öğrencilerin aradığı notlar ve sınav soruları — sende varsa yükle, puan kazan.",
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ kapsam?: string }>;
}) {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const scope = (await searchParams).kapsam === "tum" || !user?.universityId ? "tum" : "uni";

  let courseIds: string[] | undefined;
  if (scope === "uni" && user?.universityId) {
    const { data: deps } = await supabase.from("departments").select("id").eq("university_id", user.universityId);
    const depIds = (deps ?? []).map((d) => d.id);
    const { data: courses } = depIds.length
      ? await supabase.from("courses").select("id").in("department_id", depIds)
      : { data: [] as { id: string }[] };
    courseIds = (courses ?? []).map((c) => c.id);
  }

  const items = await loadRequests(supabase, {
    courseIds,
    userId: user?.id ?? null,
    limit: 100,
    withCourseLabel: true,
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="inline-flex items-center gap-2 font-heading text-3xl font-bold tracking-tight text-foreground">
          <HandWaving size={30} weight="duotone" className="text-primary" /> Not istekleri
        </h1>
        <p className="mt-1 text-sm text-muted">
          Öğrencilerin aradığı notlar. Sende varsa <b>Ben yüklerim</b>&apos;e bas — isteyenlere haber gider, sen puan
          kazanırsın. Yeni istek açmak için dersin sayfasına git.
        </p>
      </div>

      {user?.universityId && (
        <div className="flex gap-1 rounded-2xl border border-border bg-card p-1">
          {[
            ["uni", "Üniversitem"],
            ["tum", "Tüm Türkiye"],
          ].map(([k, l]) => (
            <Link
              key={k}
              href={k === "tum" ? "/istekler?kapsam=tum" : "/istekler"}
              className={`flex-1 rounded-xl px-4 py-2 text-center text-sm transition ${
                scope === k ? "bg-primary text-primary-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {l}
            </Link>
          ))}
        </div>
      )}

      <RequestBoard items={items} userId={user?.id ?? null} showCreate={false} />
    </div>
  );
}
