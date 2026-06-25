-- Test verisi temizliği.
-- Öğrencilerin eklediği üniversite/bölüm/ders + tüm notlar ve abonelikleri siler.
-- Hazır üniversite listesi (seed) korunur.
-- SQL Editor'de çalıştır.
--
-- NOT: Yüklenen PDF dosyaları storage'da kalır (Supabase SQL ile storage silmeyi
-- engelliyor). Onları Dashboard → Storage → 'notes' bucket'ından elle sil.

-- 1) Notlar
delete from notes;

-- 2) Ders bildirim abonelikleri
delete from course_subscriptions;

-- 3) Öğrenci katkılı içerikler (created_by dolu olanlar)
delete from courses where created_by is not null;
delete from departments where created_by is not null;
delete from universities where created_by is not null;
