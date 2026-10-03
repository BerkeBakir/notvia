import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { NotificationList } from "@/components/notifications/NotificationList";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id,type,message,link,read,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const list = notifications ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-heading text-3xl font-bold text-foreground">
        Bildirimler
      </h1>

      {list.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="Henüz bildirimin yok"
          description="Takip ettiğin derslere içerik eklendiğinde ve notların etkileşim aldığında burada görünecek."
          action={{ href: "/notes", label: "Notları Keşfet" }}
        />
      ) : (
        <NotificationList userId={user.id} initial={list} />
      )}
    </div>
  );
}
