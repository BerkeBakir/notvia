import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const supabase = await createClient();
  const [universities, departments] = await Promise.all([
    supabase.from("universities").select("id,name,city").order("name"),
    supabase.from("departments").select("id,name,university_id").order("name"),
  ]);

  return (
    <ProfileForm
      userId={user.id}
      initial={{
        name: user.name,
        universityId: user.universityId,
        departmentId: user.departmentId,
        classYear: user.classYear,
        termsAccepted: !!user.termsAcceptedAt,
      }}
      universities={universities.data ?? []}
      departments={departments.data ?? []}
      next={sp.next ?? "/profile"}
    />
  );
}
