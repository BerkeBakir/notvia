"use client";

import { useEffect } from "react";

/**
 * Sayfa etkileşime hazır olunca <html data-hydrated> işaretler.
 * Hazır olmadan önce JS'e bağlı düğmeler CSS ile "hazırlanıyor" görünür ve tıklanamaz;
 * böylece tıklama sessizce kaybolmaz, kullanıcı beklemesi gerektiğini görür.
 */
export function HydrationMarker() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = "1";
  }, []);
  return null;
}
