-- ivfflat (lists=100) boş tabloda kurulduğu için aramalar tek kümeye bakıp ilgili parçaları kaçırıyordu.
-- HNSW her veri boyutunda yüksek isabetle çalışır, yeniden eğitim gerektirmez.
drop index if exists public.note_chunks_embedding_idx;
create index note_chunks_embedding_idx on public.note_chunks using hnsw (embedding vector_cosine_ops);
