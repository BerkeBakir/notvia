-- Çalışma alanı: aramayı seçili notlarla (kaynaklar) sınırlayabilen benzerlik araması.
-- filter_note_ids null ise ders filtresi (varsa) uygulanır.
create or replace function match_note_chunks_v2(
  query_embedding vector(768),
  match_count int default 12,
  filter_course_id uuid default null,
  filter_note_ids uuid[] default null
)
returns table (note_id uuid, course_id uuid, content text, similarity float)
language sql stable
as $$
  select nc.note_id, nc.course_id, nc.content,
         1 - (nc.embedding <=> query_embedding) as similarity
  from note_chunks nc
  where (filter_course_id is null or nc.course_id = filter_course_id)
    and (filter_note_ids is null or nc.note_id = any(filter_note_ids))
  order by nc.embedding <=> query_embedding
  limit match_count;
$$;

create index if not exists note_chunks_note_idx on note_chunks(note_id, created_at);
