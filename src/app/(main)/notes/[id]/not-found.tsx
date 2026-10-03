import Link from "next/link";

/** Not silinmiş/kaldırılmışsa (ör. eski bir bildirimden gelindiğinde) gösterilir. */
export default function NoteNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl">🗑️</div>
      <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">
        Bu not silinmiş
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Aradığın not paylaşan kişi veya moderasyon tarafından kaldırılmış olabilir.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/notes"
          className="rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90"
        >
          Keşfet&apos;e dön
        </Link>
        <Link
          href="/notifications"
          className="rounded-full border border-border px-6 py-2.5 font-medium text-foreground hover:border-primary hover:text-primary"
        >
          Bildirimler
        </Link>
      </div>
    </div>
  );
}
