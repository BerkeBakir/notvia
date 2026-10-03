-- Asistan yanıtını üreten sağlayıcı/model bilgisini kalıcı sakla (geçmiş sohbette göstermek için)
alter table ai_messages add column if not exists provider jsonb;
