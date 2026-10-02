-- Notvia — Demo içerik seed'i (cold-start'ı kırmak için)
-- Supabase SQL Editor'de BİR KEZ çalıştır (service_role, RLS bypass).
-- Tamamen IDEMPOTENT: tekrar çalıştırmak güvenli, veri çiftlenmez.
--
-- Oluşturduğu şey:
--   • "Notvia Ekibi" demo kullanıcısı (auth kaydı YOK; sadece görüntüleme amaçlı profil satırı)
--   • 3 üniversite → bölümler → dersler
--   • ~12 gerçekçi demo not (ders notu + çıkmış sınav), beğeni/indirme sayılı
--   • Etiketler ve not-etiket bağlantıları
--
-- NOT: Notların file_url'i herkese açık örnek bir PDF'e işaret eder (gerçek içerik değil).
-- Demoyu kaldırmak için en alttaki "GERİ AL" bloğunu çalıştır.

begin;

-- 1) Demo kullanıcı (sabit uuid; users.id'nin auth.users'a FK'si yok, bu yüzden güvenli)
insert into users (id, email, name, role, plan)
values ('00000000-0000-0000-0000-00000000dede', 'demo@notvia.app', 'Notvia Ekibi', 'member', 'free')
on conflict (id) do nothing;

-- 2) Üniversiteler (name unique)
insert into universities (name, city) values
  ('Boğaziçi Üniversitesi', 'İstanbul'),
  ('Orta Doğu Teknik Üniversitesi', 'Ankara'),
  ('İstanbul Teknik Üniversitesi', 'İstanbul')
on conflict (name) do nothing;

-- 3) Bölümler (university_id, name unique)
insert into departments (university_id, name)
select u.id, d.name
from universities u
cross join (values
  ('Bilgisayar Mühendisliği'),
  ('Elektrik-Elektronik Mühendisliği'),
  ('Endüstri Mühendisliği'),
  ('Makine Mühendisliği')
) as d(name)
where u.name in ('Boğaziçi Üniversitesi', 'Orta Doğu Teknik Üniversitesi', 'İstanbul Teknik Üniversitesi')
on conflict (university_id, name) do nothing;

-- 4) Dersler (department_id, name unique) — tüm "Bilgisayar Mühendisliği" bölümlerine ortak çekirdek dersler
insert into courses (department_id, name, instructor)
select d.id, c.name, c.instructor
from departments d
cross join (values
  ('Veri Yapıları', 'Dr. A. Yılmaz'),
  ('Algoritma Analizi', 'Dr. B. Kaya'),
  ('İşletim Sistemleri', 'Dr. C. Demir'),
  ('Veritabanı Sistemleri', 'Dr. D. Şahin')
) as c(name, instructor)
where d.name = 'Bilgisayar Mühendisliği'
on conflict (department_id, name) do nothing;

-- Elektrik-Elektronik dersleri
insert into courses (department_id, name, instructor)
select d.id, c.name, c.instructor
from departments d
cross join (values
  ('Devre Teorisi', 'Dr. E. Aydın'),
  ('Sinyaller ve Sistemler', 'Dr. F. Çelik')
) as c(name, instructor)
where d.name = 'Elektrik-Elektronik Mühendisliği'
on conflict (department_id, name) do nothing;

-- Endüstri / Makine ortak temel dersler
insert into courses (department_id, name, instructor)
select d.id, c.name, c.instructor
from departments d
cross join (values
  ('Olasılık ve İstatistik', 'Dr. G. Arslan'),
  ('Diferansiyel Denklemler', 'Dr. H. Koç')
) as c(name, instructor)
where d.name in ('Endüstri Mühendisliği', 'Makine Mühendisliği')
on conflict (department_id, name) do nothing;

-- 5) Etiketler (name unique)
insert into tags (name, category) values
  ('vize', 'sınav'),
  ('final', 'sınav'),
  ('özet', 'tür'),
  ('çıkmış-soru', 'tür'),
  ('formül', 'tür')
on conflict (name) do nothing;

-- 6) Demo notlar — idempotent (demo kullanıcı + aynı başlık varsa atlanır)
with demo as (
  select '00000000-0000-0000-0000-00000000dede'::uuid as uid
),
seed_notes(uni, dep, course, title, descr, type, likes, downloads) as (
  values
    ('Boğaziçi Üniversitesi','Bilgisayar Mühendisliği','Veri Yapıları',
     'Veri Yapıları — Tam Ders Notu (Vize + Final)',
     'Bağlı listeler, yığıtlar, kuyruklar, ağaçlar (BST/AVL), hashing ve grafikler. Çizimli, örnek sorularla.',
     'note', 128, 412),
    ('Boğaziçi Üniversitesi','Bilgisayar Mühendisliği','Veri Yapıları',
     'Veri Yapıları — 2023 Final Çıkmış Sorular + Çözüm',
     'Son 3 yılın final sorularının adım adım çözümü.',
     'exam', 96, 301),
    ('Boğaziçi Üniversitesi','Bilgisayar Mühendisliği','Algoritma Analizi',
     'Algoritma Analizi — Big-O ve Karmaşıklık Özeti',
     'Asimptotik notasyon, master teoremi, böl-fethet ve dinamik programlama örnekleri.',
     'note', 84, 220),
    ('Boğaziçi Üniversitesi','Bilgisayar Mühendisliği','İşletim Sistemleri',
     'İşletim Sistemleri — Süreç & Thread Notları',
     'Scheduling, senkronizasyon (semaphore, mutex), deadlock koşulları.',
     'note', 61, 150),
    ('Boğaziçi Üniversitesi','Bilgisayar Mühendisliği','Veritabanı Sistemleri',
     'Veritabanı — Normalizasyon ve SQL Özeti',
     '1NF–BCNF, ER diyagram, JOIN türleri ve örnek sorgular.',
     'note', 73, 198),
    ('Orta Doğu Teknik Üniversitesi','Bilgisayar Mühendisliği','Algoritma Analizi',
     'Algoritmalar — 2022 Vize Çıkmış Sorular',
     'Vize sorularının detaylı çözümleri, sık yapılan hatalar.',
     'exam', 55, 134),
    ('Orta Doğu Teknik Üniversitesi','Bilgisayar Mühendisliği','İşletim Sistemleri',
     'OS — Bellek Yönetimi (Paging/Segmentation)',
     'Sanal bellek, sayfa değiştirme algoritmaları (LRU, FIFO, Optimal).',
     'note', 47, 112),
    ('Orta Doğu Teknik Üniversitesi','Elektrik-Elektronik Mühendisliği','Devre Teorisi',
     'Devre Teorisi — Formül Kağıdı',
     'Kirchhoff, Thevenin/Norton, düğüm & çevre analizi tek sayfa özet.',
     'note', 88, 240),
    ('İstanbul Teknik Üniversitesi','Elektrik-Elektronik Mühendisliği','Sinyaller ve Sistemler',
     'Sinyaller ve Sistemler — Fourier Dönüşümü Notları',
     'CT/DT Fourier serisi ve dönüşümü, konvolüsyon örnekleri.',
     'note', 69, 176),
    ('İstanbul Teknik Üniversitesi','Endüstri Mühendisliği','Olasılık ve İstatistik',
     'Olasılık — Dağılımlar ve Örnek Sorular',
     'Binom, Poisson, Normal dağılım; hipotez testi özeti.',
     'note', 52, 143),
    ('İstanbul Teknik Üniversitesi','Makine Mühendisliği','Diferansiyel Denklemler',
     'Diferansiyel Denklemler — Çözüm Teknikleri Özeti',
     '1. ve 2. mertebe ODE, Laplace dönüşümü, uygulamalı örnekler.',
     'note', 64, 167),
    ('İstanbul Teknik Üniversitesi','Makine Mühendisliği','Diferansiyel Denklemler',
     'Diferansiyel Denklemler — 2023 Final Soruları',
     'Final çıkmış sorular + tam çözüm.',
     'exam', 41, 99)
)
insert into notes (user_id, course_id, title, description, file_url, type, likes, downloads)
select
  demo.uid,
  c.id,
  s.title,
  s.descr,
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  s.type,
  s.likes,
  s.downloads
from seed_notes s
cross join demo
join universities u on u.name = s.uni
join departments d on d.university_id = u.id and d.name = s.dep
join courses c on c.department_id = d.id and c.name = s.course
where not exists (
  select 1 from notes n where n.user_id = demo.uid and n.title = s.title
);

-- 7) Not–etiket bağlantıları (idempotent: pk (note_id, tag_id))
--    'exam' notlarına 'çıkmış-soru' + 'final'/'vize'; 'note' notlarına 'özet'
insert into note_tags (note_id, tag_id)
select n.id, t.id
from notes n
join tags t on t.name = 'çıkmış-soru'
where n.user_id = '00000000-0000-0000-0000-00000000dede'::uuid and n.type = 'exam'
on conflict do nothing;

insert into note_tags (note_id, tag_id)
select n.id, t.id
from notes n
join tags t on t.name = 'özet'
where n.user_id = '00000000-0000-0000-0000-00000000dede'::uuid and n.type = 'note'
on conflict do nothing;

commit;

-- ============================================================
-- GERİ AL (demoyu tamamen kaldır) — gerekirse bu bloğu çalıştır:
--
-- delete from notes where user_id = '00000000-0000-0000-0000-00000000dede'::uuid;
-- delete from users where id = '00000000-0000-0000-0000-00000000dede'::uuid;
-- (üniversite/bölüm/ders/etiketler gerçek verilerle paylaşıldığı için silinmez)
-- ============================================================
