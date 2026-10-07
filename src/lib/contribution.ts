export interface ContributionStats {
  notesCount: number;
  likesReceived: number;
  downloadsReceived: number;
  coursesAdded: number;
  referralsMade?: number;
  requestsFulfilled?: number;
}

export interface Badge {
  icon: string;
  label: string;
}

export function computePoints(s: ContributionStats): number {
  return (
    s.notesCount * 10 +
    s.likesReceived * 5 +
    s.coursesAdded * 5 +
    s.downloadsReceived +
    (s.referralsMade ?? 0) * 15 +
    (s.requestsFulfilled ?? 0) * 20
  );
}

export function computeLevel(points: number): string {
  if (points >= 500) return "Efsane";
  if (points >= 200) return "Usta";
  if (points >= 75) return "Deneyimli";
  if (points >= 20) return "Çırak";
  return "Başlangıç";
}

export function computeBadges(s: ContributionStats): Badge[] {
  const badges: Badge[] = [];
  if (s.notesCount >= 1) badges.push({ icon: "📤", label: "İlk Katkı" });
  if (s.notesCount >= 5) badges.push({ icon: "⭐", label: "Aktif Paylaşımcı" });
  if (s.notesCount >= 20) badges.push({ icon: "🏆", label: "Süper Katkıcı" });
  if (s.likesReceived >= 10) badges.push({ icon: "❤️", label: "Beğenilen" });
  if (s.likesReceived >= 50) badges.push({ icon: "🔥", label: "Popüler" });
  if (s.coursesAdded >= 3) badges.push({ icon: "🎓", label: "Ders Kurucusu" });
  if ((s.referralsMade ?? 0) >= 1) badges.push({ icon: "🤝", label: "Davetçi" });
  if (badges.length === 0) badges.push({ icon: "🌱", label: "Yeni Üye" });
  return badges;
}

const LEVELS = [
  { name: "Başlangıç", min: 0 },
  { name: "Çırak", min: 20 },
  { name: "Deneyimli", min: 75 },
  { name: "Usta", min: 200 },
  { name: "Efsane", min: 500 },
];

/** Seviye ilerlemesi: mevcut seviye, sonraki seviye ve yüzde. */
export function levelProgress(points: number) {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].min) i++;
  const cur = LEVELS[i];
  const next = LEVELS[i + 1] ?? null;
  const pct = next ? Math.round(((points - cur.min) / (next.min - cur.min)) * 100) : 100;
  return { level: cur.name, next: next?.name ?? null, toNext: next ? next.min - points : 0, pct };
}

/** Tüm rozetler + kazanılıp kazanılmadığı + nasıl kazanılır. */
export function badgeCatalog(s: ContributionStats) {
  const r = s.referralsMade ?? 0;
  return [
    { icon: "📤", label: "İlk Katkı", hint: "İlk notunu yükle", earned: s.notesCount >= 1, progress: [s.notesCount, 1] },
    { icon: "⭐", label: "Aktif Paylaşımcı", hint: "5 not yükle", earned: s.notesCount >= 5, progress: [s.notesCount, 5] },
    { icon: "🏆", label: "Süper Katkıcı", hint: "20 not yükle", earned: s.notesCount >= 20, progress: [s.notesCount, 20] },
    { icon: "❤️", label: "Beğenilen", hint: "Notların 10 beğeni alsın", earned: s.likesReceived >= 10, progress: [s.likesReceived, 10] },
    { icon: "🔥", label: "Popüler", hint: "Notların 50 beğeni alsın", earned: s.likesReceived >= 50, progress: [s.likesReceived, 50] },
    { icon: "🎓", label: "Ders Kurucusu", hint: "3 ders ekle", earned: s.coursesAdded >= 3, progress: [s.coursesAdded, 3] },
    { icon: "🤝", label: "Davetçi", hint: "1 arkadaşını davet et", earned: r >= 1, progress: [r, 1] },
    { icon: "🙋", label: "Yardımsever", hint: "Bir not isteğini karşıla", earned: (s.requestsFulfilled ?? 0) >= 1, progress: [s.requestsFulfilled ?? 0, 1] },
  ].map((b) => ({ ...b, progress: [Math.min(b.progress[0], b.progress[1]), b.progress[1]] as [number, number] }));
}
