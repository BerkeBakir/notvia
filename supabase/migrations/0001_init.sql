-- Notvia ilk şema (notvia-proje-plani.md → Veritabanı Şeması bölümünden)

create table universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references universities(id) on delete cascade,
  name text not null
);

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  avatar_url text,
  university_id uuid references universities(id),
  department_id uuid references departments(id),
  plan text not null default 'free' check (plan in ('free', 'premium')),
  role text not null default 'member' check (role in ('guest', 'member', 'premium', 'moderator', 'admin')),
  created_at timestamptz not null default now()
);

create table notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  description text,
  file_url text not null,
  type text not null check (type in ('note', 'exam')),
  downloads integer not null default 0,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  category text
);

create table note_tags (
  note_id uuid not null references notes(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table likes (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  unique (note_id, user_id)
);

create table saves (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  unique (note_id, user_id)
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  plan text not null check (plan in ('free', 'premium')),
  start_date timestamptz not null default now(),
  end_date timestamptz,
  payment_id text
);

create index idx_notes_user_id on notes(user_id);
create index idx_notes_type on notes(type);
create index idx_comments_note_id on comments(note_id);
