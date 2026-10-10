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

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted sm:max-w-md sm:justify-end">
          <Link href="/hakkimizda" className="hover:text-primary">
            Hakkımızda ve İletişim
          </Link>
          <Link href="/privacy" className="hover:text-primary">
            Gizlilik
          </Link>
          <Link href="/terms" className="hover:text-primary">
            Şartlar
          </Link>
          <Link href="/mesafeli-satis" className="hover:text-primary">
            Mesafeli Satış
          </Link>
          <Link href="/on-bilgilendirme" className="hover:text-primary">
            Ön Bilgilendirme
          </Link>
          <Link href="/iade" className="hover:text-primary">
            İptal ve İade
          </Link>
        </nav>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Notvia · Türkiye&apos;deki tüm öğrenciler için
      </div>
    </footer>
  );
}
