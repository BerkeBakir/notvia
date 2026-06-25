// Minimal service worker — kurulabilirlik (PWA) için
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
// Ağ isteklerini olduğu gibi geçir (offline cache ileride eklenebilir)
self.addEventListener("fetch", () => {});
