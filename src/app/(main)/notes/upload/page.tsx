import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isProfileComplete } from "@/lib/supabase/auth";
import { UploadForm } from "@/components/notes/UploadForm";

export default async function UploadPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isProfileComplete(user)) redirect("/profile/edit?next=/notes/upload");

  const supabase = await createClient();
  const [universities, departments, courses] = await Promise.all([
    supabase.from("universities").select("id,name").order("name"),
    supabase.from("departments").select("id,name,university_id").order("name"),
    supabase.from("courses").select("id,name,department_id").order("name"),
  ]);

  return (
    <UploadForm
      userId={user.id}
      defaultUniversityId={user.universityId}
      defaultDepartmentId={user.departmentId}
      universities={universities.data ?? []}
      departments={departments.data ?? []}
      courses={courses.data ?? []}
    />
  );
}
