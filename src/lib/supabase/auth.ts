import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: Plan;
  universityId: string | null;
  departmentId: string | null;
  classYear: string | null;
}

export const PAID_PLANS: Plan[] = ["premium", "pro"];

export function isPaid(plan: Plan): boolean {
  return plan === "premium" || plan === "pro";
}

export function isProfileComplete(user: AuthUser): boolean {
  return (
    !!user.name.trim() &&
    !!user.universityId &&
    !!user.departmentId &&
    !!user.classYear
  );
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("plan, name, university_id, department_id, class_year")
    .eq("id", user.id)
    .maybeSingle();

  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? "",
    name:
      (profile?.name as string) ??
      (meta.full_name as string) ??
      (meta.name as string) ??
      user.email?.split("@")[0] ??
      "Kullanıcı",
    avatarUrl: (meta.avatar_url as string) ?? undefined,
    plan: (profile?.plan as Plan) ?? "free",
    universityId: profile?.university_id ?? null,
    departmentId: profile?.department_id ?? null,
    classYear: profile?.class_year ?? null,
  };
}
