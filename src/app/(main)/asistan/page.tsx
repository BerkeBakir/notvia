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
  const { data: courses } = await supabase
    .from("courses")
    .select("id,name")
    .order("name");

  return <AssistantChat courses={courses ?? []} />;
}
