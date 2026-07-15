-- Tabela de seguidores (parceiro ← investigador)
-- Colunas alinhadas às políticas RLS em 20250611000000_recommended_rls_policies.sql

CREATE TABLE IF NOT EXISTS public.subscriptions (
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (creator_id, follower_id)
);

CREATE INDEX IF NOT EXISTS subscriptions_creator_id_idx
  ON public.subscriptions (creator_id);

CREATE INDEX IF NOT EXISTS subscriptions_follower_id_idx
  ON public.subscriptions (follower_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "subscriptions_select_public" ON public.subscriptions;
CREATE POLICY "subscriptions_select_public"
  ON public.subscriptions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "subscriptions_insert_own" ON public.subscriptions;
CREATE POLICY "subscriptions_insert_own"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "subscriptions_delete_own" ON public.subscriptions;
CREATE POLICY "subscriptions_delete_own"
  ON public.subscriptions FOR DELETE
  USING (auth.uid() = follower_id);
