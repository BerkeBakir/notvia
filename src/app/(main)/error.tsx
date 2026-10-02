"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="text-5xl">😕</div>
      <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">
        Bir şeyler ters gitti
      </h2>
      <p className="mt-2 text-sm text-muted">
        Beklenmeyen bir hata oluştu. Lütfen tekrar dene.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-primary px-6 py-2.5 font-medium text-primary-foreground hover:opacity-90"
      >
        Tekrar dene
      </button>
    </div>
  );
}
