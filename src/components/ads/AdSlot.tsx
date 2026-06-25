"use client";

import { useEffect } from "react";

/**
 * Reklam alanı. Yalnızca ücretsiz/anonim kullanıcıya (show=true) gösterilir.
 * NEXT_PUBLIC_ADSENSE_CLIENT ayarlıysa AdSense reklamı, değilse yer tutucu.
 */
export function AdSlot({ show, slot }: { show: boolean; slot?: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  useEffect(() => {
    if (show && client) {
      try {
        const w = window as unknown as { adsbygoogle?: unknown[] };
        w.adsbygoogle = w.adsbygoogle || [];
        w.adsbygoogle.push({});
      } catch {
        // AdSense henüz yüklenmediyse sessizce geç
      }
    }
  }, [show, client]);

  if (!show) return null;

  if (!client) {
    return (
      <div className="grid h-24 place-items-center rounded-xl border border-dashed border-border text-xs text-muted">
        Reklam alanı
      </div>
    );
  }

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client={client}
      data-ad-slot={slot ?? ""}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
