-- Beğenmeme (dislike) + 5 üzerinden puan için altyapı

alter table notes add column if not exists dislikes integer not null default 0;

create table dislikes (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  unique (note_id, user_id)
);

alter table dislikes enable row level security;
create policy "dislikes_select_all" on dislikes for select using (true);
create policy "dislikes_insert_own" on dislikes
  for insert with check (auth.uid() = user_id);
create policy "dislikes_delete_own" on dislikes
  for delete using (auth.uid() = user_id);

create index idx_dislikes_note_id on dislikes(note_id);

-- Sayaç senkronizasyonu
create or replace function public.sync_note_dislikes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT') then
    update public.notes set dislikes = dislikes + 1 where id = new.note_id;
  elsif (tg_op = 'DELETE') then
    update public.notes set dislikes = greatest(dislikes - 1, 0) where id = old.note_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_dislike_change on dislikes;
create trigger on_dislike_change
  after insert or delete on dislikes
  for each row
  execute function public.sync_note_dislikes();
