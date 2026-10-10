-- Yükleme sertleştirmesi.

-- Depoya yalnızca PDF (HTML/SVG/JS gibi dosyalar herkese açık kovada barındırılamasın).
update storage.buckets set allowed_mime_types = array['application/pdf'] where id = 'notes';

-- Not kaydı yalnızca yükleyenin kendi klasöründeki depo dosyasını gösterebilir
-- (dış site / başkasının dosyası / sunucu tarafı istek sahteciliği engellenir).
alter table public.notes add constraint notes_file_url_own_storage check (
  file_url ~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/notes/' || user_id::text || '/[^/?#]+$')
);

-- Aşırı uzun başlık/açıklama ile sayfaları şişirme engeli.
alter table public.notes add constraint notes_title_len check (char_length(title) between 1 and 200);
alter table public.notes add constraint notes_description_len check (description is null or char_length(description) <= 2000);
