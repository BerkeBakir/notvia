"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import {
  BookmarkSimple,
  Books,
  Compass,
  Crown,
  FileArrowUp,
  List,
  MagnifyingGlass,
  PlusCircle,
  Robot,
  ShieldCheck,
  SignOut,
  SignIn,
  Trophy,
  User,
  Bell,
  CalendarCheck,
  HandWaving,
  UsersThree,
  X,
  type Icon,
} from "@phosphor-icons/react";

type Item = { href: string; label: string; icon: Icon; desc?: string };

const GROUPS: { title: string; items: Item[]; auth?: boolean }[] = [
  {
    title: "Dersler",
    items: [
      { href: "/notes", label: "Keşfet", icon: Compass, desc: "Üniversite → bölüm → ders" },
      { href: "/search", label: "Ara", icon: MagnifyingGlass, desc: "Başlık ya da konuyla bul" },
      { href: "/notes/upload", label: "Not Yükle", icon: FileArrowUp },
      { href: "/courses/new", label: "Ders Ekle", icon: PlusCircle },
      { href: "/istekler", label: "Not istekleri", icon: HandWaving, desc: "Aranan notlar — sende varsa yükle" },
    ],
  },
  {
    title: "Sınav",
    items: [
      { href: "/takvim", label: "Sınav takvimi", icon: CalendarCheck, desc: "Geri sayım + e-posta hatırlatma" },
    ],
  },
  {
    title: "AI",
    items: [
      { href: "/asistan", label: "AI Asistan", icon: Robot, desc: "Notlardan kaynaklı cevap" },
      { href: "/kaydedilenler", label: "Kaydedilen cevaplar", icon: BookmarkSimple },
    ],
  },
  {
    title: "Topluluk",
    items: [
      { href: "/arkadaslar", label: "Arkadaşlar", icon: UsersThree, desc: "Akış, liste, arkadaş bul" },
      { href: "/leaderboard", label: "Liderlik", icon: Trophy },
      { href: "/premium", label: "Premium", icon: Crown },
    ],
  },
  {
    title: "Ben",
    auth: true,
    items: [
      { href: "/profile", label: "Profilim", icon: User },
      { href: "/notifications", label: "Bildirimler", icon: Bell },
    ],
  },
];

/** Tüm ekran boyutlarında açılan, başlıklara ayrılmış site menüsü (sağdan çekmece). */
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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    if (open) window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const groups = GROUPS.filter((g) => !g.auth || isLoggedIn);

  return (
    <>
      <button
        type="button"
        aria-label="Menüyü aç"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border text-foreground transition hover:border-primary hover:text-primary"
      >
        <List size={20} weight="bold" />
      </button>

      {open && createPortal(
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Site menüsü">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <nav className="drawer-in absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
              <span className="font-heading text-lg font-bold text-foreground">
                {isLoggedIn ? `Merhaba, ${(userName || "").split(" ")[0] || "öğrenci"} 👋` : "Menü"}
              </span>
              <button
                type="button"
                aria-label="Menüyü kapat"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-card hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
              {groups.map((g) => (
                <div key={g.title}>
                  <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                    {g.title}
                  </p>
                  <ul>
                    {g.items.map((it) => {
                      const active = pathname === it.href;
                      return (
                        <li key={it.href}>
                          <Link
                            href={it.href}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                              active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-card"
                            }`}
                          >
                            <it.icon size={20} weight="duotone" className={active ? "text-primary" : "text-muted"} />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">{it.label}</span>
                              {it.desc && <span className="block text-xs text-muted">{it.desc}</span>}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                    {g.title === "Ben" && isMod && (
                      <li>
                        <Link href="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-foreground transition hover:bg-card">
                          <ShieldCheck size={20} weight="duotone" className="text-muted" />
                          <span className="text-sm font-medium">Moderasyon</span>
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>

            <div className="shrink-0 space-y-3 border-t border-border p-4">
              {isLoggedIn ? (
                <form action="/api/auth/signout" method="post">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary hover:text-primary"
                  >
                    <SignOut size={18} /> Çıkış Yap
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  <SignIn size={18} /> Giriş Yap / Kaydol
                </Link>
              )}
              <div className="flex justify-center gap-4 text-xs text-muted">
                <Link href="/privacy" className="hover:text-foreground">Gizlilik</Link>
                <Link href="/terms" className="hover:text-foreground">Şartlar</Link>
                <span className="inline-flex items-center gap-1"><Books size={12} /> Notvia</span>
              </div>
            </div>
          </nav>
        </div>,
        // Header'daki backdrop-blur, fixed çocukları header içine hapseder → body'ye taşı
        document.body,
      )}
    </>
  );
}
