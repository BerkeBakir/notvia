# Notvia AI Çalışma Arkadaşı — Tasarım

Tarih: 2026-10-03
Durum: Onaylandı

## Amaç

Notvia'ya, platforma yüklenen ders notları üzerinden RAG (retrieval-augmented
generation) ile çalışan bir AI çalışma arkadaşı eklemek. Kullanıcı hem tüm
platform genelinde ("neyi nerede bulurum") hem de belirli bir ders bazında
("bu derse nasıl çalışırım") sohbet edebilir. Mevcut not sayfalarındaki AI
araçları bu yeni, ayrı bölüme bağlanır.

Teknik yaklaşım: model **eğitimi değil**, RAG. Notlar embedding'e çevrilip
pgvector'da saklanır; sorgu anında ilgili parçalar çekilip Gemini'ye bağlam
olarak verilir. Böylece yeni not yüklenince sistem anında "öğrenir", kaynak
gösterebilir ve maliyet düşük kalır.

## Mimari

İki parça:

### İndeksleme (yükleme anında)
1. Not yüklenince (yalnızca **metin katmanlı PDF**) PDF'ten metin çıkarılır.
2. Metin ~500-800 token'lık, örtüşmeli parçalara bölünür.
3. Her parça Gemini `text-embedding-004` ile 768 boyutlu vektöre çevrilir.
4. Vektörler Supabase'de pgvector tablosunda saklanır.
5. Metin katmanı çıkmayan PDF'ler "indekslenmedi" olarak işaretlenir (OCR
   sonraki faz).

### Sohbet (sorgu anında)
1. Kullanıcı sorusu + kapsam (`all` | `course`) alınır.
2. Soru embedding'e çevrilir.
3. Kapsama göre filtrelenmiş pgvector benzerlik araması (cosine), en ilgili
   top-k parça çekilir.
4. Parçalar + sistem promptu Gemini `gemini-2.5-flash`'e verilir, cevap
   streaming olarak döndürülür.
5. Cevapla birlikte kaynak not linkleri (`sources`) döndürülür.

## Veri modeli (yeni tablolar)

- `note_chunks` — `id, note_id (fk), course_id (fk), content text, embedding vector(768), created_at`
  - pgvector ivfflat index (cosine) benzerlik araması için
- `ai_conversations` — `id, user_id (fk), scope_type ('all'|'course'), scope_course_id (fk, nullable), title, created_at`
- `ai_messages` — `id, conversation_id (fk), role ('user'|'assistant'), content text, sources jsonb, created_at`

Günlük limit sayımı ayrı tablo gerektirmez; `ai_messages`'tan
(`role='user'`, bugünün tarihi) türetilir.

RLS: kullanıcı yalnızca kendi `ai_conversations` / `ai_messages` kayıtlarını
okur/yazar. `note_chunks` okuma herkese açık (notlar zaten public), yazma
service_role.

## Yetenekler

Hepsi aynı RAG motoru, farklı prompt şablonları:

1. **Soru-cevap** — notlardan cevap + kaynak not linki
2. **Keşif/yönlendirme** — "X konusunu nerede bulurum" → doğru ders/not
3. **Özet/anlatım** — konuyu notlardan sade anlatır
4. **Çalışma planı** — ders bazlı "finale nasıl hazırlanırım"
5. **Quiz üret** — notlardan interaktif sınav soruları

## Arayüz (3 giriş noktası, tek motor)

- **`/asistan`** — tam sayfa sohbet; üstte kapsam seçici + sol/geçmiş paneli
- **Ders sayfası sekmesi** — o derse kilitli sohbet
- **Yüzen widget** — her sayfada, bulunulan bağlama göre kapsam

## Erişim / limit

- Ücretsiz kullanıcı: **günde 5 soru**
- Pro: sınırsız
- Limit dolunca "Pro'ya geç" yönlendirmesi

## Hata yönetimi

- Metin katmanı olmayan PDF → indekslenmez, not işaretlenir
- Gemini kotası dolarsa → kullanıcıya nazik hata mesajı, sohbet bozulmaz
- Limit aşımı → upgrade mesajı (429 benzeri)
- Mevcut yüklü notlar için **tek seferlik backfill script'i** tüm metin
  katmanlı PDF'leri indeksler

## Test

- Birim: chunking mantığı, kapsam filtresi (all vs course), günlük limit sayımı
- Entegrasyon: ingest → retrieve döngüsü (örnek PDF → chunk → embed → sorgu →
  doğru parça)

## Fazlama

- **Faz 1 (MVP):** indeksleme pipeline + pgvector + `/asistan` + soru-cevap +
  kaynaklar + günlük limit + sohbet geçmişi + backfill
- **Faz 2:** ders sayfası sekmesi + çalışma planı + quiz
- **Faz 3:** yüzen widget + görüntü-PDF OCR + açık kaynak model opsiyonu

## Kapsam dışı (şimdilik)

- Model fine-tuning / gerçek eğitim
- Görüntü-PDF OCR
- Gemini dışı / açık kaynak model entegrasyonu (ileride opsiyon)
