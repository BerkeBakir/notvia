import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, isProfileComplete } from "@/lib/supabase/auth";
import { AddCourseForm } from "@/components/notes/AddCourseForm";

export default async function NewCoursePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isProfileComplete(user)) redirect("/profile/edit?next=/courses/new");

  const supabase = await createClient();
  const [universities, departments, courses] = await Promise.all([
    supabase.from("universities").select("id,name,city").order("name"),
    supabase.from("departments").select("id,name,university_id").order("name"),
    supabase.from("courses").select("id,name,department_id").order("name"),
  ]);

  return (
    <AddCourseForm
      userId={user.id}
      universities={universities.data ?? []}
      departments={departments.data ?? []}
      courses={courses.data ?? []}
      defaultUniversityId={user.universityId}
      defaultDepartmentId={user.departmentId}
    />
  );
}
