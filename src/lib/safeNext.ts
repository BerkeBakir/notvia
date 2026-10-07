/** Yalnızca site içi göreli yol kabul et (açık yönlendirme koruması). */
export function safeNext(next: string | null | undefined, fallback = "/notes"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
