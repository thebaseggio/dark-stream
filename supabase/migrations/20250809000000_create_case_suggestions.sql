-- Mural de sugestões de casos da comunidade (assinantes ativos)

CREATE OR REPLACE FUNCTION public.has_active_subscription()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND subscription_status = 'active'
  );
$$;

CREATE TABLE IF NOT EXISTS public.case_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL CHECK (category IN ('Nacional', 'Internacional', 'Sobrenatural')),
  upvotes_count integer NOT NULL DEFAULT 0 CHECK (upvotes_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS case_suggestions_created_at_idx
  ON public.case_suggestions (created_at DESC);

CREATE INDEX IF NOT EXISTS case_suggestions_upvotes_idx
  ON public.case_suggestions (upvotes_count DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.case_suggestion_votes (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id uuid NOT NULL REFERENCES public.case_suggestions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, suggestion_id)
);

CREATE INDEX IF NOT EXISTS case_suggestion_votes_suggestion_idx
  ON public.case_suggestion_votes (suggestion_id);

CREATE OR REPLACE FUNCTION public.increment_case_suggestion_upvote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.case_suggestions
  SET upvotes_count = upvotes_count + 1
  WHERE id = NEW.suggestion_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS case_suggestion_votes_increment ON public.case_suggestion_votes;
CREATE TRIGGER case_suggestion_votes_increment
  AFTER INSERT ON public.case_suggestion_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_case_suggestion_upvote();

ALTER TABLE public.case_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_suggestion_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "case_suggestions_select_subscribers_partners" ON public.case_suggestions;
CREATE POLICY "case_suggestions_select_subscribers_partners"
  ON public.case_suggestions FOR SELECT
  USING (
    public.has_active_subscription()
    OR public.is_partner()
  );

DROP POLICY IF EXISTS "case_suggestions_insert_subscribers" ON public.case_suggestions;
CREATE POLICY "case_suggestions_insert_subscribers"
  ON public.case_suggestions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_active_subscription()
  );

DROP POLICY IF EXISTS "case_suggestion_votes_select_own" ON public.case_suggestion_votes;
CREATE POLICY "case_suggestion_votes_select_own"
  ON public.case_suggestion_votes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "case_suggestion_votes_insert_subscribers" ON public.case_suggestion_votes;
CREATE POLICY "case_suggestion_votes_insert_subscribers"
  ON public.case_suggestion_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_active_subscription()
  );

GRANT SELECT, INSERT ON public.case_suggestions TO authenticated;
GRANT SELECT, INSERT ON public.case_suggestion_votes TO authenticated;
