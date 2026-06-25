# Notvia — Proje İskeleti

Detaylı plan: [notvia-proje-plani.md](./notvia-proje-plani.md)

## Klasör Yapısı

```
src/
  app/
    (auth)/login, (auth)/register       → Kimlik doğrulama sayfaları
    (main)/notes/[id], notes/upload     → Not detay & yükleme
    (main)/exams/[id]                   → Sınav sorusu detay
    (main)/profile/[username]           → Kullanıcı profili
    (main)/search                       → Arama & filtreleme
    api/notes, exams, auth, comments, likes → Route handlers
  components/
    ui/        → Genel UI bileşenleri (shadcn/Radix tabanlı)
    notes/      → Not kartı, yükleme formu, önizleme
    layout/     → Header, sidebar, footer
    shared/     → Ortak bileşenler (avatar, badge, vb.)
  lib/
    supabase/   → Supabase client (browser/server)
    utils/      → Yardımcı fonksiyonlar
    validations/→ Zod şemaları
  hooks/        → Custom React hook'ları
  store/        → Zustand store'ları
  types/        → Ortak TypeScript tipleri (index.ts)
  styles/       → Global CSS / Tailwind config eklentileri
public/
  icons/, images/
supabase/
  migrations/   → SQL migration dosyaları (0001_init.sql hazır)
  seed/         → Geliştirme verisi
```

## Sonraki Adım

Bağımlılıkları kurup `package.json`, `tsconfig.json`, Tailwind ve Supabase client kurulumunu yapmak (plandaki "Sonraki Adım" 3-4. maddeler).
