-- Colunas usadas pelo CreatorUploadForm / UploadProvider ao publicar vídeos

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS gostei_muito integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gostei integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nao_gostei integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS short_type text,
  ADD COLUMN IF NOT EXISTS parent_video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL;

-- O formulário envia tags como array; alinha com text[]
ALTER TABLE public.videos
  ALTER COLUMN tags TYPE text[]
  USING CASE
    WHEN tags IS NULL OR btrim(tags) = '' THEN '{}'::text[]
    ELSE string_to_array(tags, ',')::text[]
  END;

-- views é enviado como número no insert
ALTER TABLE public.videos
  ALTER COLUMN views TYPE integer
  USING CASE
    WHEN views IS NULL OR btrim(views) = '' THEN 0
    ELSE views::integer
  END;

ALTER TABLE public.videos
  ALTER COLUMN views SET DEFAULT 0;

CREATE INDEX IF NOT EXISTS videos_parent_video_id_idx ON public.videos(parent_video_id);
