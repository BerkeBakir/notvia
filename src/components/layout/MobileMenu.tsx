"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/notes", label: "Keşfet", icon: "🔍" },
  { href: "/search", label: "Ara", icon: "🔎" },
  { href: "/courses/new", label: "Ders Ekle", icon: "➕" },
  { href: "/notes/upload", label: "Not Yükle", icon: "📄" },
  { href: "/leaderboard", label: "Liderlik", icon: "🏆" },
  { href: "/premium", label: "⭐ Premium", icon: "" },
];

export function MobileMenu({
  isLoggedIn,
  userName,
  isMod,
}: {
  isLoggedIn: boolean;
  userName?: string | null;
  isMod?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Rota değişince menüyü kapat
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Menü açıkken arka plan kaymasın
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground"
      >
        <span className="text-lg leading-none">{open ? "✕" : "☰"}</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-16 z-40 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <nav className="animate-fade-up fixed inset-x-0 top-16 z-50 border-b border-border bg-background p-4 shadow-xl">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-4 py-3 text-base text-foreground hover:bg-primary/10 hover:text-primary"
                >
                  {l.icon && <span className="mr-2">{l.icon}</span>}
                  {l.label}
                </Link>
              ))}

              <div className="my-2 border-t border-border" />

              {isLoggedIn ? (
                <>
                  <Link
                    href="/profile"
                    className="rounded-lg px-4 py-3 text-base text-foreground hover:bg-primary/10 hover:text-primary"
                  >
                    👤 {userName || "Profilim"}
                  </Link>
                  {isMod && (
                    <Link
                      href="/admin"
                      className="rounded-lg px-4 py-3 text-base text-foreground hover:bg-primary/10 hover:text-primary"
                    >
                      🛡️ Moderasyon
                    </Link>
                  )}
                  <form action="/api/auth/signout" method="post" className="mt-1">
                    <button
                      type="submit"
                      className="w-full rounded-lg border border-border px-4 py-3 text-base font-medium text-foreground hover:border-primary hover:text-primary"
                    >
                      Çıkış Yap
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-lg bg-primary px-4 py-3 text-center text-base font-medium text-primary-foreground hover:opacity-90"
                >
                  Giriş Yap
                </Link>
              )}
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
