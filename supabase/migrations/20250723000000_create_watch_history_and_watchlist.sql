-- Histórico de reprodução e lista do usuário (Continuar Assistindo / Minha Lista)

CREATE TABLE IF NOT EXISTS public.user_watch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  progress_seconds integer NOT NULL DEFAULT 0 CHECK (progress_seconds >= 0),
  duration_seconds integer NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS user_watch_history_user_updated_idx
  ON public.user_watch_history (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.user_watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, video_id)
);

CREATE INDEX IF NOT EXISTS user_watchlist_user_created_idx
  ON public.user_watchlist (user_id, created_at DESC);

ALTER TABLE public.user_watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_watch_history_select_own" ON public.user_watch_history;
CREATE POLICY "user_watch_history_select_own"
  ON public.user_watch_history FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_watch_history_insert_own" ON public.user_watch_history;
CREATE POLICY "user_watch_history_insert_own"
  ON public.user_watch_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_watch_history_update_own" ON public.user_watch_history;
CREATE POLICY "user_watch_history_update_own"
  ON public.user_watch_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_watch_history_delete_own" ON public.user_watch_history;
CREATE POLICY "user_watch_history_delete_own"
  ON public.user_watch_history FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_watchlist_select_own" ON public.user_watchlist;
CREATE POLICY "user_watchlist_select_own"
  ON public.user_watchlist FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_watchlist_insert_own" ON public.user_watchlist;
CREATE POLICY "user_watchlist_insert_own"
  ON public.user_watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_watchlist_delete_own" ON public.user_watchlist;
CREATE POLICY "user_watchlist_delete_own"
  ON public.user_watchlist FOR DELETE
  USING (auth.uid() = user_id);
