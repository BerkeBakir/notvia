import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="font-heading text-6xl font-bold text-primary">404</div>
      <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">
        Sayfa bulunamadı
      </h2>
      <p className="mt-2 text-sm text-muted">
        Aradığın içerik taşınmış veya hiç var olmamış olabilir.
      </p>
      <Link
        href="/notes"
        className="mt-6 rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90"
      >
        Keşfet&apos;e dön
      </Link>
    </div>
  );
}
