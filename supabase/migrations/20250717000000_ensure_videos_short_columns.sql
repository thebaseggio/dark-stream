-- Garante colunas de Shorts na tabela videos (idempotente).
-- parent_video_id pode já existir via 20250712000004_add_videos_rating_and_short_columns.sql

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS is_short boolean NOT NULL DEFAULT false;

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS parent_video_id uuid REFERENCES public.videos(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS videos_is_short_idx ON public.videos(is_short);

CREATE INDEX IF NOT EXISTS videos_parent_video_id_idx ON public.videos(parent_video_id);

COMMENT ON COLUMN public.videos.is_short IS 'True para Shorts (9:16). Ocultar das listagens de casos longos.';
COMMENT ON COLUMN public.videos.parent_video_id IS 'Caso principal ao qual este Short de atualização pertence.';
