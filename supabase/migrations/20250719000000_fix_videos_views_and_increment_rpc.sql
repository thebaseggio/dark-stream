-- Corrige views NULL na tabela videos e cria RPC increment_views (SECURITY DEFINER).

-- 1. Normalizar registros existentes
UPDATE public.videos
SET views = 0
WHERE views IS NULL;

-- 2. Garantir default e NOT NULL para novos registros
ALTER TABLE public.videos
  ALTER COLUMN views SET DEFAULT 0;

ALTER TABLE public.videos
  ALTER COLUMN views SET NOT NULL;

-- 3. RPC para incrementar views (contorna RLS — visitantes não podem UPDATE direto em videos)
CREATE OR REPLACE FUNCTION public.increment_views(
  video_row_id uuid,
  viewer_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.videos
  SET views = COALESCE(views, 0) + 1
  WHERE id = video_row_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Vídeo não encontrado: %', video_row_id;
  END IF;

  IF viewer_id IS NOT NULL THEN
    BEGIN
      INSERT INTO public.views (video_id, user_id)
      VALUES (video_row_id, viewer_id);
    EXCEPTION
      WHEN undefined_table THEN
        NULL;
      WHEN OTHERS THEN
        NULL;
    END;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_views(uuid, uuid) TO anon, authenticated;
