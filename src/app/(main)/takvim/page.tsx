import { redirect } from "next/navigation";
import { CalendarCheck } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { ExamPlanner, type Exam } from "@/components/exams/ExamPlanner";

export const metadata = { title: "Sınav takvimi" };

export default async function ExamCalendarPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/takvim");
  const supabase = await createClient();

  // Ders seçimi: önce kendi bölümün, sonra üniversitenin diğer dersleri
  const { data: deps } = user.universityId
    ? await supabase.from("departments").select("id,name").eq("university_id", user.universityId)
    : { data: [] as { id: string; name: string }[] };
  const depName = new Map((deps ?? []).map((d) => [d.id, d.name]));
  const [{ data: courses }, { data: exams }] = await Promise.all([
    (deps ?? []).length
      ? supabase.from("courses").select("id,name,department_id").in("department_id", (deps ?? []).map((d) => d.id))
      : Promise.resolve({ data: [] as { id: string; name: string; department_id: string }[] }),
    supabase
      .from("exams")
      .select("id,course_id,title,kind,exam_at,location,remind")
      .eq("user_id", user.id)
      .order("exam_at"),
  ]);

  const options = (courses ?? [])
    .map((c) => ({ id: c.id, name: c.name, hint: depName.get(c.department_id), mine: c.department_id === user.departmentId }))
    .sort((a, b) => Number(b.mine) - Number(a.mine) || a.name.localeCompare(b.name, "tr"));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="inline-flex items-center gap-2 font-heading text-3xl font-bold tracking-tight text-foreground">
          <CalendarCheck size={30} weight="duotone" className="text-primary" /> Sınav takvimi
        </h1>
        <p className="mt-1 text-sm text-muted">
          Sınavlarını ekle; geri sayımı gör, yaklaşınca e-posta ile hatırlatalım ve o dersin notlarına tek tıkla git.
        </p>
      </div>
      <ExamPlanner userId={user.id} initial={(exams ?? []) as Exam[]} courses={options} />
    </div>
  );
}
