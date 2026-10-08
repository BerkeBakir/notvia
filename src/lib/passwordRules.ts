// Şifre kuralları: hem kayıt formundaki canlı kontrol listesi hem sunucu doğrulaması kullanır.
export const PASSWORD_RULES: { key: string; label: string; test: (p: string) => boolean }[] = [
  { key: "len", label: "En az 8 karakter", test: (p) => p.length >= 8 },
  { key: "upper", label: "Bir büyük harf (A-Z)", test: (p) => /[A-ZÇĞİÖŞÜ]/.test(p) },
  { key: "lower", label: "Bir küçük harf (a-z)", test: (p) => /[a-zçğıöşü]/.test(p) },
  { key: "digit", label: "Bir rakam (0-9)", test: (p) => /\d/.test(p) },
  { key: "special", label: "Bir özel karakter (!@#$%…)", test: (p) => /[^A-Za-z0-9ÇĞİÖŞÜçğıöşü\s]/.test(p) },
];

export function passwordOk(p: string) {
  return PASSWORD_RULES.every((r) => r.test(p));
}
