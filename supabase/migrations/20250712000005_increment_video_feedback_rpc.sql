-- Incrementa gostei ou nao_gostei no vídeo (feedback público do player)

CREATE OR REPLACE FUNCTION public.increment_video_feedback(
  video_row_id uuid,
  feedback_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF feedback_type = 'gostei' THEN
    UPDATE public.videos
    SET gostei = COALESCE(gostei, 0) + 1
    WHERE id = video_row_id;
  ELSIF feedback_type = 'nao_gostei' THEN
    UPDATE public.videos
    SET nao_gostei = COALESCE(nao_gostei, 0) + 1
    WHERE id = video_row_id;
  ELSE
    RAISE EXCEPTION 'feedback_type inválido: %', feedback_type;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_video_feedback(uuid, text) TO anon, authenticated;
