// Ortak bölüm kataloğu: her bölüm adı bir kez tanımlanır, her üniversitenin
// seçim listesinde görünür. Veritabanına (departments) ancak biri seçtiğinde eklenir.
export const DEPARTMENT_CATALOG = [
  "Bilgisayar Mühendisliği", "Yazılım Mühendisliği", "Elektrik-Elektronik Mühendisliği",
  "Endüstri Mühendisliği", "Makine Mühendisliği", "İnşaat Mühendisliği", "Kimya Mühendisliği",
  "Mekatronik Mühendisliği", "Biyomedikal Mühendisliği", "Gıda Mühendisliği", "Çevre Mühendisliği",
  "Harita Mühendisliği", "Mimarlık", "İç Mimarlık", "Şehir ve Bölge Planlama",
  "Tıp", "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Fizyoterapi ve Rehabilitasyon",
  "Beslenme ve Diyetetik", "Ebelik", "Hukuk", "İşletme", "İktisat", "Uluslararası İlişkiler",
  "Siyaset Bilimi ve Kamu Yönetimi", "Maliye", "Uluslararası Ticaret ve Lojistik",
  "Yönetim Bilişim Sistemleri", "Muhasebe ve Finans Yönetimi", "Psikoloji", "Sosyoloji", "Tarih",
  "Türk Dili ve Edebiyatı", "İngiliz Dili ve Edebiyatı", "Felsefe", "Coğrafya", "Matematik",
  "Fizik", "Kimya", "Biyoloji", "Moleküler Biyoloji ve Genetik", "İstatistik",
  "Sınıf Öğretmenliği", "Matematik Öğretmenliği", "İngilizce Öğretmenliği",
  "Okul Öncesi Öğretmenliği", "Rehberlik ve Psikolojik Danışmanlık", "Özel Eğitim Öğretmenliği",
  "Gazetecilik", "Halkla İlişkiler ve Tanıtım", "Radyo, Televizyon ve Sinema", "Grafik Tasarım",
  "Turizm İşletmeciliği", "Gastronomi ve Mutfak Sanatları", "Spor Bilimleri", "İlahiyat",
  "Sosyal Hizmet", "Veterinerlik",
];

export const CATALOG_PREFIX = "cat:";

/** Üniversitenin mevcut bölümleri + katalogda olup henüz eklenmemiş olanlar, alfabetik. */
export function departmentOptions(
  existing: { id: string; name: string }[],
): { value: string; label: string }[] {
  const have = new Set(existing.map((d) => d.name.toLocaleLowerCase("tr")));
  return [
    ...existing.map((d) => ({ value: d.id, label: d.name })),
    ...DEPARTMENT_CATALOG.filter((n) => !have.has(n.toLocaleLowerCase("tr"))).map((n) => ({
      value: CATALOG_PREFIX + n,
      label: n,
    })),
  ].sort((a, b) => a.label.localeCompare(b.label, "tr"));
}
