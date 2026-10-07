import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isProfileComplete } from "@/lib/supabase/auth";
import { UploadForm } from "@/components/notes/UploadForm";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function UploadPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; request?: string }>;
}) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isProfileComplete(user)) redirect("/profile/edit?next=/notes/upload");

  const supabase = await createClient();
  const [universities, departments, courses] = await Promise.all([
    supabase.from("universities").select("id,name").order("name"),
    supabase.from("departments").select("id,name,university_id").order("name"),
    supabase.from("courses").select("id,name,department_id").order("name"),
  ]);

  // İstekten / dersten gelindiyse ders ön-seçili
  let defUni = user.universityId;
  let defDep = user.departmentId;
  let defCourse: string | null = null;
  let request: { id: string; title: string } | null = null;
  const courseParam = sp.course && UUID.test(sp.course) ? sp.course : null;
  if (courseParam) {
    const c = (courses.data ?? []).find((x) => x.id === courseParam);
    const d = c && (departments.data ?? []).find((x) => x.id === c.department_id);
    if (c && d) {
      defCourse = c.id;
      defDep = d.id;
      defUni = d.university_id;
    }
  }
  if (sp.request && UUID.test(sp.request)) {
    const { data: r } = await supabase
      .from("note_requests")
      .select("id,title,status,course_id")
      .eq("id", sp.request)
      .maybeSingle();
    if (r && r.status === "open" && r.course_id === defCourse) request = { id: r.id, title: r.title };
  }

  return (
    <UploadForm
      key={defCourse ?? "new"}
      defaultCourseId={defCourse}
      request={request}
      userId={user.id}
      defaultUniversityId={defUni}
      defaultDepartmentId={defDep}
      universities={universities.data ?? []}
      departments={departments.data ?? []}
      courses={courses.data ?? []}
    />
  );
}
