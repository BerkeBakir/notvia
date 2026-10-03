"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AdSlot } from "@/components/ads/AdSlot";

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
        title="İndir"
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-muted hover:text-primary disabled:opacity-50"
      >
        <span>⬇</span>
        <span>{count}</span>
      </button>

      {overlay && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted">
              İndirme {seconds} saniye içinde başlayacak...
            </p>
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
