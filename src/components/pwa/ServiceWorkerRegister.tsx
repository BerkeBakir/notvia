"use client";

import { useEffect } from "react";

// NOT: Service worker geçici olarak devre dışı.
// Eski SW (boş fetch handler) Next.js App Router gezinmesini bozuyordu.
// Bu bileşen artık yeni SW kaydetmiyor; aksine mevcut/bozuk SW'leri kaldırıp
// cache'leri temizliyor. PWA offline desteği ileride doğru bir SW ile eklenebilir.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((reg) => reg.unregister()))
      .catch(() => {});
    if (window.caches) {
      caches
        .keys()
        .then((keys) => keys.forEach((k) => caches.delete(k)))
        .catch(() => {});
    }
  }, []);
  return null;
}
