import { redirect } from "next/navigation";
import { Target } from "@phosphor-icons/react/dist/ssr";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { QuestBoard, type Quest } from "@/components/quests/QuestBoard";

export const metadata = { title: "Haftalık görevler" };

export default async function QuestsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/gorevler");
  const supabase = await createClient();
  const { data } = await supabase.rpc("weekly_quest_progress");

  // Pazartesiye kalan gün (İstanbul saatiyle)
  const ist = new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  const dow = (ist.getDay() + 6) % 7; // 0 = pazartesi
  const daysLeft = 7 - dow;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="inline-flex items-center gap-2 font-heading text-3xl font-bold tracking-tight text-foreground">
          <Target size={30} weight="duotone" className="text-primary" /> Haftalık görevler
        </h1>
        <p className="mt-1 text-sm text-muted">
          Her pazartesi yenilenir. Görevi tamamla, <b>Ödülü al</b>&apos;a bas — puanın profiline ve liderliğe eklenir.
        </p>
      </div>
      <QuestBoard initial={(data ?? []) as Quest[]} daysLeft={daysLeft} />
    </div>
  );
}
