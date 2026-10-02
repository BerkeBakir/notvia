import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/auth";
import { MarkAllRead } from "@/components/notifications/MarkAllRead";
import { EmptyState } from "@/components/ui/EmptyState";

const ICONS: Record<string, string> = {
  comment: "💬",
  like: "♥",
  note: "📄",
};

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
      <MarkAllRead userId={user.id} />
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
        <ul className="space-y-2">
          {list.map((n) => {
            const inner = (
              <div
                className={
                  n.read
                    ? "flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                    : "flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4"
                }
              >
                <span className="text-lg">{ICONS[n.type] ?? "🔔"}</span>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(n.created_at).toLocaleString("tr-TR")}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.link ? <Link href={n.link}>{inner}</Link> : inner}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
