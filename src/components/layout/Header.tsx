import Link from "next/link";
import { getCurrentUser, isModerator } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NotificationBell } from "@/components/notifications/NotificationBell";

export async function Header() {
  const user = await getCurrentUser();

  let unread = 0;
  if (user) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);
    unread = count ?? 0;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-xl font-bold text-foreground"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            N
          </span>
          Notvia
        </Link>

        <nav className="flex items-center gap-2 sm:gap-4 text-sm">
          <Link
            href="/notes"
            className="hidden px-2 text-muted hover:text-foreground sm:block"
          >
            Keşfet
          </Link>
          <Link
            href="/asistan"
            className="hidden px-2 text-muted hover:text-foreground sm:block"
          >
            Asistan
          </Link>
          <Link
            href="/search"
            className="hidden px-2 text-muted hover:text-foreground sm:block"
          >
            Ara
          </Link>
          <Link
            href="/notes/upload"
            className="hidden px-2 text-muted hover:text-foreground sm:block"
          >
            Not Yükle
          </Link>
          <Link
            href="/premium"
            className="hidden px-2 font-medium text-primary hover:opacity-80 sm:block"
          >
            ⭐ Premium
          </Link>

          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell userId={user.id} initialUnread={unread} />
              {isModerator(user) && (
                <Link
                  href="/admin"
                  className="hidden px-2 text-muted hover:text-primary sm:block"
                  title="Moderasyon"
                >
                  🛡️
                </Link>
              )}
              <Link
                href="/profile"
                className="hidden text-foreground hover:text-primary sm:block"
              >
                {user.name}
              </Link>
              <form
                action="/api/auth/signout"
                method="post"
                className="hidden sm:block"
              >
                <button
                  type="submit"
                  className="rounded-full border border-border px-4 py-2 font-medium text-foreground hover:border-primary hover:text-primary"
                >
                  Çıkış
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 sm:inline-block"
            >
              Giriş Yap
            </Link>
          )}

          <MobileMenu
            isLoggedIn={!!user}
            userName={user?.name}
            isMod={!!user && isModerator(user)}
          />
        </nav>
      </div>
    </header>
  );
}
