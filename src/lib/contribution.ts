export interface ContributionStats {
  notesCount: number;
  likesReceived: number;
  downloadsReceived: number;
  coursesAdded: number;
  referralsMade?: number;
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
    (s.referralsMade ?? 0) * 15
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
