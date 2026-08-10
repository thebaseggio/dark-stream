-- Flag para casos originados de sugestões da comunidade
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS is_community_suggestion BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.videos.is_community_suggestion IS
  'Indica que o caso foi publicado a partir de uma sugestão do mural da comunidade.';
