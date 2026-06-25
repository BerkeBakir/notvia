# 🎓 Notvia — Proje Planı & Geliştirme Yol Haritası

> **Üniversite öğrencileri için not ve sınav sorusu paylaşım platformu**  
> Web sitesi + Mobil Uygulama (React Native / PWA)

---

## 📌 Proje Özeti

**Notvia**, üniversite öğrencilerinin ders notlarını, özet belgelerini ve geçmiş sınav sorularını birbirleriyle paylaşabildiği; hem web hem mobil üzerinden erişilebilen bir topluluk platformudur. Platform, reklam gelirleri ve premium üyelik sistemi ile sürdürülebilir bir iş modeline sahiptir.

---

## 🏗️ Teknik Mimari

### Frontend
- **Web:** React.js + Tailwind CSS
- **Mobil:** React Native (iOS & Android) veya PWA (Progressive Web App) — başlangıç için PWA önerilir, maliyet düşük
- **UI Kütüphanesi:** shadcn/ui veya Radix UI
- **State Yönetimi:** Zustand veya Redux Toolkit

### Backend
- **Framework:** Node.js + Express.js veya Next.js (Full-stack)
- **Veritabanı:** PostgreSQL (Supabase üzerinden — ücretsiz başlangıç planı mevcut)
- **Dosya Depolama:** Supabase Storage veya AWS S3
- **Arama:** Algolia veya Supabase Full-Text Search

### Kimlik Doğrulama
- **Google OAuth 2.0** (Firebase Auth veya Supabase Auth ile)
- E-posta + şifre alternatifi (opsiyonel)

### Hosting & Deployment
- **Web:** Vercel (Next.js için ideal, ücretsiz başlangıç)
- **Backend API:** Railway veya Render
- **CDN:** Cloudflare

---

## 👤 Kullanıcı Rolleri

| Rol | Yetki |
|-----|-------|
| **Misafir** | İçerikleri önizleme (kısıtlı), kayıt sayfasını görme |
| **Ücretsiz Üye** | Not yükleme (aylık limit), indirme (günlük limit), reklam görür |
| **Premium Üye** | Sınırsız yükleme & indirme, reklamsız deneyim, erken erişim |
| **Moderatör** | İçerik denetimi, kullanıcı şikayeti yönetimi |
| **Admin** | Tam platform yönetimi |

---

## 📋 Temel Özellikler (MVP)

### 1. Kimlik Doğrulama
- [ ] Google ile giriş (OAuth 2.0)
- [ ] Kullanıcı profili (üniversite, bölüm, sınıf bilgisi)
- [ ] Avatar & biyografi düzenleme

### 2. İçerik Paylaşımı
- [ ] **Not yükleme:** PDF, Word, görsel formatları desteklenmeli
- [ ] **Sınav sorusu yükleme:** Yıl, ders, hoca adı etiketleme
- [ ] Ders adı, üniversite, bölüm etiketleme sistemi
- [ ] İçerik önizleme (ilk 2 sayfa ücretsiz görünür)
- [ ] Dosya boyutu limiti (ücretsiz: 20MB, premium: 100MB)

### 3. Keşif & Arama
- [ ] Üniversite, bölüm, ders adına göre filtreleme
- [ ] Trending içerikler (bu hafta en çok indirilen)
- [ ] Önerilen içerikler (aynı bölümdeki kullanıcılara)
- [ ] Tam metin arama

### 4. Sosyal Özellikler
- [ ] Beğeni & yorum sistemi
- [ ] İçerik kaydetme (favoriler)
- [ ] Kullanıcı takip etme
- [ ] Paylaşım sayacı & istatistik

### 5. Bildirim Sistemi
- [ ] Takip edilen kullanıcı yeni not yüklediğinde
- [ ] Yorum & beğeni bildirimleri
- [ ] Uygulama içi + e-posta bildirimleri

---

## 💰 Para Kazanma Modeli

### A) Reklam Gelirleri
- **Google AdSense** — web sitesi için banner reklamlar
- **AdMob** — mobil uygulama için (React Native)
- Reklam konumları:
  - Ana sayfa sidebar
  - İndirme öncesi interstitial reklam (5 sn bekleme)
  - Liste aralarında native reklam (her 5 içerikte 1)

### B) Premium Üyelik (Freemium Model)
| Özellik | Ücretsiz | Premium (₺49/ay veya ₺299/yıl) |
|---------|----------|--------------------------------|
| Aylık yükleme | 5 dosya | Sınırsız |
| Günlük indirme | 3 dosya | Sınırsız |
| Reklam | Var | Yok |
| Önizleme | 2 sayfa | Tam |
| Öncelikli destek | Hayır | Evet |

### C) Ek Gelir Kaynakları (Faz 2)
- **Rozet & Puan Sistemi:** Çok paylaşım yapan kullanıcılara "Katkıda Bulunan" rozeti, premium ay hediyesi
- **Üniversite Ortaklıkları:** Kurum lisansı satışı
- **Sponsorlu İçerik:** Yayınevleri ve eğitim şirketlerinden sponsorluk
- **Affiliate:** Kitap & kırtasiye önerileri ile komisyon

---

## 🧭 Geliştirme Yol Haritası

### Faz 1 — MVP (8-10 hafta)
```
Hafta 1-2: Proje kurulumu, veritabanı tasarımı, Google Auth
Hafta 3-4: Dosya yükleme & indirme sistemi, etiketleme
Hafta 5-6: Arama & filtreleme, kullanıcı profilleri
Hafta 7-8: UI/UX geliştirme, responsive tasarım
Hafta 9-10: Test, hata düzeltme, soft launch
```

### Faz 2 — Büyüme (Ay 3-5)
- Premium üyelik sistemi entegrasyonu (İyzico / Stripe)
- Mobil uygulama (PWA → React Native)
- Bildirim sistemi
- Moderasyon paneli
- İstatistik dashboard'u

### Faz 3 — Ölçeklendirme (Ay 6+)
- Yapay zeka destekli not özeti (Claude API ile)
- Flashcard oluşturma özelliği
- Canlı çalışma odaları (WebRTC)
- Üniversite bazlı topluluklar
- API açma (üçüncü taraf entegrasyon)

---

## 🤖 Yapay Zeka Entegrasyon Fikirleri (Ekstra Değer)

Bu özellikler Notvia'yı rakiplerinden ayırır:

1. **Otomatik Özet:** Yüklenen notu Claude API ile özetle (premium özellik)
2. **Akıllı Etiketleme:** Yüklenen dosyadan otomatik ders/konu tespiti
3. **Soru Üretici:** Notlardan pratik sınav soruları oluşturma
4. **İçerik Kalite Skoru:** AI ile not kalitesi değerlendirme (0-100 puan)
5. **Benzer Not Önerisi:** Vektör tabanlı semantic search

---

## 🗄️ Veritabanı Şeması (Özet)

```sql
users           → id, email, name, avatar, university, department, plan, created_at
notes           → id, user_id, title, description, file_url, type(note/exam), tags, downloads, likes
universities    → id, name, city
departments     → id, university_id, name
tags            → id, name, category
note_tags       → note_id, tag_id
comments        → id, note_id, user_id, content, created_at
likes           → id, note_id, user_id
saves           → id, note_id, user_id
subscriptions   → id, user_id, plan, start_date, end_date, payment_id
```

---

## 🛡️ Güvenlik & Hukuki Konular

- **Telif Hakkı:** Kullanıcılar yüklerken "Bu içerik bana aittir veya paylaşım hakkım vardır" onay kutusunu işaretlemeli
- **KVKK Uyumluluğu:** Türk kullanıcılar için KVKK (GDPR benzeri) gizlilik politikası zorunlu
- **İçerik Denetimi:** Şikayet sistemi + moderatör ekibi
- **Dosya Tarama:** Yüklenen dosyalar kötü amaçlı yazılım taramasından geçmeli
- **Rate Limiting:** API kötüye kullanımını önlemek için

---

## 📱 UI/UX Tasarım Prensipleri

- **Renk Paleti:** Koyu lacivert + parlak turkuaz + beyaz (akademik + modern)
- **Tipografi:** Inter (body) + Sora (başlıklar)
- **Mobil önce tasarım** (Mobile-first)
- Yükleme hızı önceliği (Core Web Vitals)
- Karanlık mod desteği
- Türkçe + İngilizce dil desteği

---

## 📊 Başarı Metrikleri (KPI)

| Metrik | Hedef (3. ay) | Hedef (6. ay) |
|--------|--------------|--------------|
| Kayıtlı kullanıcı | 500 | 5.000 |
| Yüklenen içerik | 1.000 | 15.000 |
| Aylık aktif kullanıcı | 300 | 3.000 |
| Premium dönüşüm oranı | %3 | %5 |
| Aylık reklam geliri | ₺500 | ₺5.000 |

---

## 🚀 Sonraki Adım

1. **İsim & Domain onayı** → notvia.com / notvia.app / notvia.com.tr
2. **Figma ile wireframe** → Ana sayfa, not listesi, yükleme akışı
3. **Supabase projesi kurulumu** → Veritabanı + Auth + Storage
4. **Next.js projesi başlatma** → Proje iskeleti oluşturma
5. **Google OAuth entegrasyonu** → İlk çalışan özellik

---

*Hazırlayan: Notvia Proje Ekibi | Hazırlanma: Haziran 2026*
