-- Row Level Security politikaları
-- Herkese açık okuma (universities, departments, tags, notes, comments)
-- Yazma sadece kimliği doğrulanmış kullanıcıya ve kendi verisine

alter table universities enable row level security;
alter table departments enable row level security;
alter table users enable row level security;
alter table notes enable row level security;
alter table tags enable row level security;
alter table note_tags enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table saves enable row level security;
alter table subscriptions enable row level security;

-- Herkese açık referans verileri
create policy "universities_select_all" on universities for select using (true);
create policy "departments_select_all" on departments for select using (true);
create policy "tags_select_all" on tags for select using (true);
create policy "note_tags_select_all" on note_tags for select using (true);

-- users
create policy "users_select_all" on users for select using (true);
create policy "users_insert_own" on users for insert with check (auth.uid() = id);
create policy "users_update_own" on users for update using (auth.uid() = id);

-- notes
create policy "notes_select_all" on notes for select using (true);
create policy "notes_insert_own" on notes for insert with check (auth.uid() = user_id);
create policy "notes_update_own" on notes for update using (auth.uid() = user_id);
create policy "notes_delete_own" on notes for delete using (auth.uid() = user_id);

-- comments
create policy "comments_select_all" on comments for select using (true);
create policy "comments_insert_own" on comments for insert with check (auth.uid() = user_id);
create policy "comments_update_own" on comments for update using (auth.uid() = user_id);
create policy "comments_delete_own" on comments for delete using (auth.uid() = user_id);

-- likes
create policy "likes_select_all" on likes for select using (true);
create policy "likes_insert_own" on likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on likes for delete using (auth.uid() = user_id);

-- saves
create policy "saves_select_own" on saves for select using (auth.uid() = user_id);
create policy "saves_insert_own" on saves for insert with check (auth.uid() = user_id);
create policy "saves_delete_own" on saves for delete using (auth.uid() = user_id);

-- subscriptions
create policy "subscriptions_select_own" on subscriptions for select using (auth.uid() = user_id);
