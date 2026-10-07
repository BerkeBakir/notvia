// Türkçe büyük/küçük harf + aksan duyarsız arama yardımcıları.

export function norm(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i");
}

/** 0 = eşleşmedi, 2 = baştan / kelime başı / kısaltma ("odtu"), 1 = içinde geçiyor */
export function matchScore(text: string, query: string): number {
  const q = norm(query.trim());
  if (!q) return 2;
  const t = norm(text);
  const words = t.split(/[\s-]+/).filter(Boolean);
  const initials = words.map((w) => w[0]).join("");
  if (t.startsWith(q) || words.some((w) => w.startsWith(q)) || initials.startsWith(q)) return 2;
  return t.includes(q) ? 1 : 0;
}
