import { createClient } from "@/lib/supabase/server";
import type { Plan, Role } from "@/types";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  plan: Plan;
  role: Role;
  universityId: string | null;
  departmentId: string | null;
  classYear: string | null;
}

export const PAID_PLANS: Plan[] = ["premium", "pro"];

export function isPaid(plan: Plan): boolean {
  return plan === "premium" || plan === "pro";
}

export function isModerator(user: AuthUser): boolean {
  return user.role === "moderator" || user.role === "admin";
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
    .select("plan, role, name, university_id, department_id, class_year, premium_until")
    .eq("id", user.id)
    .maybeSingle();

  // Süreli (ödülle verilen) planın süresi dolduysa ücretsize düş
  let plan = (profile?.plan as Plan) ?? "free";
  if (plan !== "free" && profile?.premium_until && new Date(profile.premium_until) < new Date()) {
    plan = "free";
  }

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
    plan,
    role: (profile?.role as Role) ?? "member",
    universityId: profile?.university_id ?? null,
    departmentId: profile?.department_id ?? null,
    classYear: profile?.class_year ?? null,
  };
}
