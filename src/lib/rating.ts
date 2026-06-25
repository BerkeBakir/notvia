/**
 * Beğeni/beğenmeme oranından 5 üzerinden puan hesaplar.
 * Hiç oy yoksa null döner.
 */
export function computeRating(likes: number, dislikes: number): number | null {
  const total = likes + dislikes;
  if (total === 0) return null;
  return Math.round((likes / total) * 5 * 10) / 10;
}

/** Yıldız gösterimi: ★★★★☆ benzeri (dolu/boş). */
export function ratingStars(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}
