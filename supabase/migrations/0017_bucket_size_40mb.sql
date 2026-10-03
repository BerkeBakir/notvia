-- Not PDF'leri için yükleme boyut limitini 40MB'a çıkar
update storage.buckets set file_size_limit = 41943040 where id = 'notes';
