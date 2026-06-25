-- AI not özetleri için önbellek tablosu (Pro özelliği)
-- Özet bir kez üretilir, tekrar istendiğinde buradan döner (maliyet tasarrufu).

create table note_summaries (
  note_id uuid primary key references notes(id) on delete cascade,
  summary text not null,
  created_at timestamptz not null default now()
);

alter table note_summaries enable row level security;

-- Herkes okuyabilir; yazma yalnızca sunucu (service_role) üzerinden yapılır
create policy "note_summaries_select_all" on note_summaries
  for select using (true);
