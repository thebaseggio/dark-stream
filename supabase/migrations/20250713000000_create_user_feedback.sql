-- Preferências de recomendação por usuário (player: Recomendar Mais / Não Recomendar)

CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  rating text NOT NULL CHECK (rating IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS user_feedback_user_id_idx ON public.user_feedback (user_id);
CREATE INDEX IF NOT EXISTS user_feedback_video_id_idx ON public.user_feedback (video_id);
CREATE INDEX IF NOT EXISTS user_feedback_rating_idx ON public.user_feedback (rating);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_feedback_select_own" ON public.user_feedback;
CREATE POLICY "user_feedback_select_own"
  ON public.user_feedback FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_feedback_insert_own" ON public.user_feedback;
CREATE POLICY "user_feedback_insert_own"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_feedback_update_own" ON public.user_feedback;
CREATE POLICY "user_feedback_update_own"
  ON public.user_feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_feedback_delete_own" ON public.user_feedback;
CREATE POLICY "user_feedback_delete_own"
  ON public.user_feedback FOR DELETE
  USING (auth.uid() = user_id);
