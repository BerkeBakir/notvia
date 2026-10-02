// Kendini kaldıran service worker.
// Eski sürüm (boş fetch handler) Next.js App Router client-side gezinmesini bozuyordu;
// bu sürüm mevcut kullanıcılardaki bozuk SW'yi otomatik temizler.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", async () => {
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  } catch {}
  await self.registration.unregister();
  const clients = await self.clients.matchAll({ type: "window" });
  clients.forEach((client) => client.navigate(client.url));
});
