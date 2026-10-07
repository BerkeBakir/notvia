/** E-posta HTML'ine kullanıcı verisi gömerken kaçışla (HTML enjeksiyonunu önler). */
export function esc(s: string | null | undefined): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
