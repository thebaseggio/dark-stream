-- Aplica mudança de feedback (toggle, inversão ou novo voto) nos contadores públicos do vídeo

CREATE OR REPLACE FUNCTION public.apply_video_feedback_change(
  video_row_id uuid,
  previous_type text DEFAULT NULL,
  next_type text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF previous_type = 'gostei' THEN
    UPDATE public.videos
    SET gostei = GREATEST(COALESCE(gostei, 0) - 1, 0)
    WHERE id = video_row_id;
  ELSIF previous_type = 'nao_gostei' THEN
    UPDATE public.videos
    SET nao_gostei = GREATEST(COALESCE(nao_gostei, 0) - 1, 0)
    WHERE id = video_row_id;
  ELSIF previous_type IS NOT NULL AND previous_type <> '' THEN
    RAISE EXCEPTION 'previous_type inválido: %', previous_type;
  END IF;

  IF next_type = 'gostei' THEN
    UPDATE public.videos
    SET gostei = COALESCE(gostei, 0) + 1
    WHERE id = video_row_id;
  ELSIF next_type = 'nao_gostei' THEN
    UPDATE public.videos
    SET nao_gostei = COALESCE(nao_gostei, 0) + 1
    WHERE id = video_row_id;
  ELSIF next_type IS NOT NULL AND next_type <> '' THEN
    RAISE EXCEPTION 'next_type inválido: %', next_type;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.apply_video_feedback_change(uuid, text, text) TO anon, authenticated;
