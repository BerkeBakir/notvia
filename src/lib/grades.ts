// Not hesaplayıcının saf hesaplama mantığı (bileşenden ayrıldı, test edilebilir).

export const LETTERS: [string, number][] = [
  ["AA", 4],
  ["BA", 3.5],
  ["BB", 3],
  ["CB", 2.5],
  ["CC", 2],
  ["DC", 1.5],
  ["DD", 1],
  ["FD", 0.5],
  ["FF", 0],
];

// Yaygın T-skoru → harf tablosu (sınıf ortalaması "orta" düzeydeyken). Üniversiteden üniversiteye değişir.
export const T_TABLE: [number, string][] = [
  [59, "AA"],
  [54, "BA"],
  [49, "BB"],
  [44, "CB"],
  [39, "CC"],
  [34, "DC"],
  [29, "DD"],
  [24, "FD"],
  [-Infinity, "FF"],
];

/** Kullanıcı girdisini sayıya çevirir; boşsa NaN, virgülü ondalık kabul eder. */
export const num = (v: string) => (v.trim() === "" ? NaN : Number(v.replace(",", ".")));

/** Finalden kaç alınması gerektiği. Ağırlıklar yüzde, notlar 0-100. Eksik/geçersiz girdide null. */
export function finalNeeded(
  parts: { weight: string; score: string }[],
  finalWeight: string,
  pass: string,
  finalMin: string,
) {
  const fw = num(finalWeight);
  const ps = parts.map((p) => ({ w: num(p.weight), s: num(p.score) }));
  const total = ps.reduce((a, p) => a + (Number.isNaN(p.w) ? 0 : p.w), 0) + (Number.isNaN(fw) ? 0 : fw);
  if (Number.isNaN(fw) || ps.some((p) => Number.isNaN(p.w) || Number.isNaN(p.s))) return null;
  const earned = ps.reduce((a, p) => a + (p.w * p.s) / 100, 0);
  const target = Number.isNaN(num(pass)) ? 50 : num(pass);
  const need = ((target - earned) / fw) * 100;
  const fmin = num(finalMin);
  const needFinal = Math.max(need, Number.isNaN(fmin) ? -Infinity : fmin, 0);
  return { total, earned, need: needFinal, rawNeed: need, fmin, target, fw };
}

/** Standart normal CDF (Abramowitz-Stegun yaklaşımı). */
export function normalCdf(v: number) {
  const k = 1 / (1 + 0.2316419 * Math.abs(v));
  const d = 0.3989423 * Math.exp((-v * v) / 2);
  const p = d * k * (0.3193815 + k * (-0.3565638 + k * (1.781478 + k * (-1.821256 + k * 1.330274))));
  return v > 0 ? 1 - p : p;
}

/** Bağıl not: z, T-skoru, tahmini harf ve yüzdelik dilim. Geçersiz girdide null. */
export function relativeGrade(mean: string, sd: string, score: string) {
  const m = num(mean),
    s = num(sd),
    x = num(score);
  if ([m, s, x].some(Number.isNaN) || s <= 0) return null;
  const z = (x - m) / s;
  const t = 50 + 10 * z;
  const letter = T_TABLE.find(([min]) => t >= min)![1];
  return { z, t, letter, pct: normalCdf(z) * 100 };
}

/** Dönem ortalaması (YANO) ve varsa genel ortalama (AGNO). Kredisi geçersiz satırlar atlanır. */
export function gpa(rows: { credit: string; letter: string }[], prevGpa: string, prevCredit: string) {
  const val = Object.fromEntries(LETTERS);
  let c = 0,
    p = 0;
  for (const row of rows) {
    const cr = num(row.credit);
    if (Number.isNaN(cr) || cr <= 0) continue;
    c += cr;
    p += cr * val[row.letter];
  }
  const term = c ? p / c : null;
  const pg = num(prevGpa),
    pc = num(prevCredit);
  const cum = !Number.isNaN(pg) && !Number.isNaN(pc) && pc > 0 && c ? (pg * pc + p) / (pc + c) : null;
  return { term, cum, credits: c };
}
