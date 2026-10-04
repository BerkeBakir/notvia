// src/app/(main)/asistan/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { AssistantChat, type CourseGroup } from "@/components/ai/AssistantChat";

export const metadata = {
  title: "Çalışma Arkadaşı",
  description: "Notvia'daki notlara dayanarak sorularını yanıtlayan AI çalışma arkadaşı.",
};

type CourseRow = {
  id: string;
  name: string;
  departments: { universities: { name: string } | null } | null;
};

export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/asistan");

  const supabase = await createClient();
  const [{ data: courses }, { data: conversations }] = await Promise.all([
    supabase
      .from("courses")
      .select("id,name,departments(universities(name))")
      .order("name"),
    supabase
      .from("ai_conversations")
      .select("id,title,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // Aynı ders adını (farklı üniversitelerdeki kopyaları) tek grupta topla
  const groupMap = new Map<string, CourseGroup>();
  for (const c of (courses ?? []) as unknown as CourseRow[]) {
    const key = c.name.trim().toLocaleLowerCase("tr");
    const university = c.departments?.universities?.name ?? "Bilinmeyen üniversite";
    const g = groupMap.get(key);
    if (g) g.entries.push({ courseId: c.id, university });
    else groupMap.set(key, { name: c.name.trim(), entries: [{ courseId: c.id, university }] });
  }
  const courseGroups = [...groupMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "tr"),
  );

  return <AssistantChat courseGroups={courseGroups} conversations={conversations ?? []} />;
}
