import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isPaid } from "@/lib/supabase/auth";
import { UniversityBrowser } from "@/components/notes/UniversityBrowser";
import { AdSlot } from "@/components/ads/AdSlot";

export default async function BrowsePage() {
  const supabase = await createClient();
  const user = await getCurrentUser();
  const showAds = !user || !isPaid(user.plan);

  const [universitiesRes, departmentsRes, coursesRes, notesRes] =
    await Promise.all([
      supabase.from("universities").select("id,name,city").order("name"),
      supabase.from("departments").select("id,name,university_id").order("name"),
      supabase
        .from("courses")
        .select("id,name,instructor,department_id")
        .order("name"),
      supabase.from("notes").select("course_id"),
    ]);

  const notes = notesRes.data ?? [];
  const noteCounts: Record<string, number> = {};
  for (const n of notes) {
    if (n.course_id) {
      noteCounts[n.course_id] = (noteCounts[n.course_id] ?? 0) + 1;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-accent/5 p-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Keşfet
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            Üniversite ve bölümlere göre ders notlarını ve geçmiş sınav
            sorularını keşfet. Aradığın ders yoksa sen ekle.
          </p>
        </div>
      </div>

      <AdSlot show={showAds} />

      <UniversityBrowser
        universities={universitiesRes.data ?? []}
        departments={departmentsRes.data ?? []}
        courses={coursesRes.data ?? []}
        noteCounts={noteCounts}
      />
    </div>
  );
}
