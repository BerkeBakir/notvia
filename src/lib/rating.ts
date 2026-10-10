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

const Z = 1.96; // %95 güven

/**
 * Wilson alt sınırı: beğeni oranının, oy sayısını hesaba katan "en kötü makul" tahmini (0-1).
 * 1 beğenili not ≈ 0.21, 40 beğeni / 2 beğenmeme ≈ 0.84 — az oyla şişen notlar öne geçmez.
 * Veritabanındaki notes.quality_score sütunu aynı formülle hesaplanır (0042 migration).
 */
export function wilsonScore(likes: number, dislikes: number): number {
  const n = likes + dislikes;
  if (n === 0) return 0;
  const p = likes / n;
  const z2 = Z * Z;
  return (p + z2 / (2 * n) - Z * Math.sqrt((p * (1 - p) + z2 / (4 * n)) / n)) / (1 + z2 / n);
}

export const COMMUNITY_APPROVED_MIN_LIKES = 5;
export const COMMUNITY_APPROVED_MIN_SCORE = 0.5; // ör. 5 beğeni + 0 beğenmeme ≈ 0.57 onaylı; 6 + 1 ≈ 0.49 değil

/** "Topluluk onaylı" rozeti: yeterince beğeni almış ve beğenenleri açıkça çoğunlukta olan notlar. */
export function isCommunityApproved(likes: number, dislikes: number): boolean {
  return likes >= COMMUNITY_APPROVED_MIN_LIKES && wilsonScore(likes, dislikes) >= COMMUNITY_APPROVED_MIN_SCORE;
}
