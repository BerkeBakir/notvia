-- Örnek başlangıç verisi: üniversite → bölüm → ders
-- SQL Editor'de bir kez çalıştır (RLS'i bypass eden service_role ile).

with uni as (
  insert into universities (name, city) values
    ('Boğaziçi Üniversitesi', 'İstanbul'),
    ('Orta Doğu Teknik Üniversitesi', 'Ankara'),
    ('İstanbul Teknik Üniversitesi', 'İstanbul')
  returning id, name
),
dept as (
  insert into departments (university_id, name)
  select uni.id, d.name
  from uni
  cross join (values
    ('Bilgisayar Mühendisliği'),
    ('Elektrik-Elektronik Mühendisliği'),
    ('Endüstri Mühendisliği')
  ) as d(name)
  returning id, name, university_id
)
insert into courses (department_id, name, instructor)
select dept.id, c.name, c.instructor
from dept
cross join (values
  ('Veri Yapıları', 'Dr. A. Yılmaz'),
  ('Algoritmalar', 'Dr. B. Kaya'),
  ('Diferansiyel Denklemler', 'Dr. C. Demir')
) as c(name, instructor)
where dept.name = 'Bilgisayar Mühendisliği';
