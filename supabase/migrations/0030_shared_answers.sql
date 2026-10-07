-- Arkadaşa gönderilen AI cevapları: alıcının "Kaydedilenler"ine kopya düşer, kimden geldiği tutulur.
alter table public.ai_saved_answers add column if not exists shared_by uuid references public.users(id) on delete set null;
create index if not exists ai_saved_answers_shared_by_idx on public.ai_saved_answers(shared_by, created_at desc);
