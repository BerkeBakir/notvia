"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdSlot } from "@/components/ads/AdSlot";
import { DownloadSimple } from "@phosphor-icons/react";

export function DownloadButton({
  noteId,
  fileUrl,
  fileName,
  initialCount,
  showAd = false,
}: {
  noteId: string;
  fileUrl: string;
  fileName: string;
  initialCount: number;
  showAd?: boolean;
}) {
  const supabase = createClient();
  const [count, setCount] = useState(initialCount);
  const [overlay, setOverlay] = useState(false);
  const [seconds, setSeconds] = useState(5);
  const started = useRef(false);

  function runDownload() {
    // Sayaç arka planda; indirme tarayıcının kendi indiricisiyle hemen başlar
    // (büyük dosyayı önce belleğe çekmez). Supabase ?download= ekini zorlar.
    void supabase.rpc("increment_download", { note_id: noteId });
    setCount((c) => c + 1);
    const sep = fileUrl.includes("?") ? "&" : "?";
    const a = document.createElement("a");
    a.href = `${fileUrl}${sep}download=${encodeURIComponent(fileName)}`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function onClick() {
    if (showAd) {
      started.current = false;
      setSeconds(5);
      setOverlay(true);
    } else {
      runDownload();
    }
  }

  // Geri sayım
  useEffect(() => {
    if (!overlay) return;
    if (seconds <= 0) {
      if (!started.current) {
        started.current = true;
        runDownload();
        setOverlay(false);
      }
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overlay, seconds]);

  return (
    <>
      <button
        onClick={onClick}
        className="group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
      >
        <DownloadSimple size={18} weight="bold" className="transition group-hover:translate-y-0.5" />
        İndir
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs tabular-nums group-hover:bg-primary-foreground/20">
          {count}
        </span>
      </button>

      {overlay && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="animate-fade-up w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 font-heading text-xl font-bold text-primary tabular-nums">
              {seconds}
            </div>
            <p className="mt-3 text-sm text-muted">İndirmen birazdan başlayacak...</p>
            <div className="mt-4">
              <AdSlot show slot="" />
            </div>
            <p className="mt-4 text-xs text-muted">
              Reklamsız ve sınırsız indirme için{" "}
              <a href="/premium" className="text-primary hover:underline">
                Premium
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
