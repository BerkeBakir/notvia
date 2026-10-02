import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/"
            className="flex items-center gap-2 font-heading text-lg font-bold text-foreground"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
              N
            </span>
            Notvia
          </Link>
          <p className="mt-2 max-w-xs text-sm text-muted">
            Üniversite öğrencileri için topluluk katkılı not & sınav paylaşım
            platformu.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
          <Link href="/notes" className="hover:text-primary">
            Keşfet
          </Link>
          <Link href="/courses/new" className="hover:text-primary">
            Ders Ekle
          </Link>
          <Link href="/leaderboard" className="hover:text-primary">
            Liderlik
          </Link>
          <Link href="/notes/upload" className="hover:text-primary">
            Not Yükle
          </Link>
          <Link href="/premium" className="hover:text-primary">
            Premium
          </Link>
          <Link href="/privacy" className="hover:text-primary">
            Gizlilik
          </Link>
          <Link href="/terms" className="hover:text-primary">
            Şartlar
          </Link>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Notvia · Türkiye&apos;deki tüm öğrenciler için
      </div>
    </footer>
  );
}
