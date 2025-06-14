-- Adiciona novas colunas para informações do Spotify
ALTER TABLE public.music_suggestions
ADD COLUMN IF NOT EXISTS image_url character varying(512) null,
ADD COLUMN IF NOT EXISTS preview_url character varying(512) null,
ADD COLUMN IF NOT EXISTS duration_ms integer null,
ADD COLUMN IF NOT EXISTS spotify_id character varying(255) null,
ADD COLUMN IF NOT EXISTS album_name character varying(255) null; 