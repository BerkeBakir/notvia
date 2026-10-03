// src/app/(main)/asistan/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { AssistantChat } from "@/components/ai/AssistantChat";

export const metadata = {
  title: "Çalışma Arkadaşı",
  description: "Notvia'daki notlara dayanarak sorularını yanıtlayan AI çalışma arkadaşı.",
};

export default async function AssistantPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/asistan");

  const supabase = await createClient();
  const [{ data: courses }, { data: conversations }] = await Promise.all([
    supabase.from("courses").select("id,name").order("name"),
    supabase
      .from("ai_conversations")
      .select("id,title,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <AssistantChat
      courses={courses ?? []}
      conversations={conversations ?? []}
    />
  );
}
