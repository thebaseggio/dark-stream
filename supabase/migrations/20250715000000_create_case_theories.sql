-- Fórum de teorias por caso (case theories)

CREATE TABLE IF NOT EXISTS public.case_theories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS case_theories_video_id_idx ON public.case_theories (video_id);
CREATE INDEX IF NOT EXISTS case_theories_user_id_idx ON public.case_theories (user_id);
CREATE INDEX IF NOT EXISTS case_theories_created_at_idx ON public.case_theories (created_at DESC);

ALTER TABLE public.case_theories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "case_theories_select_public" ON public.case_theories;
CREATE POLICY "case_theories_select_public"
  ON public.case_theories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "case_theories_insert_own" ON public.case_theories;
CREATE POLICY "case_theories_insert_own"
  ON public.case_theories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "case_theories_delete_own" ON public.case_theories;
CREATE POLICY "case_theories_delete_own"
  ON public.case_theories FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "case_theories_update_own" ON public.case_theories;
CREATE POLICY "case_theories_update_own"
  ON public.case_theories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
