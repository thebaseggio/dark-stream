-- REVISAR ANTES DE APLICAR EM PRODUÇÃO
-- Políticas recomendadas com base no código do Dark Stream.
-- Se políticas equivalentes já existirem no projeto remoto, compare no Dashboard antes de executar.
-- Preferível: rodar `supabase db pull` primeiro para capturar o schema real.

-- Helper: verifica se o usuário autenticado é parceiro
CREATE OR REPLACE FUNCTION public.is_partner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'partner'
  );
$$;

-- =============================================================================
-- PROFILES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- VIDEOS
-- =============================================================================
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "videos_select_public" ON public.videos;
CREATE POLICY "videos_select_public"
  ON public.videos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "videos_insert_partner_own" ON public.videos;
CREATE POLICY "videos_insert_partner_own"
  ON public.videos FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND public.is_partner()
  );

DROP POLICY IF EXISTS "videos_update_partner_own" ON public.videos;
CREATE POLICY "videos_update_partner_own"
  ON public.videos FOR UPDATE
  USING (auth.uid() = creator_id AND public.is_partner())
  WITH CHECK (auth.uid() = creator_id AND public.is_partner());

DROP POLICY IF EXISTS "videos_delete_partner_own" ON public.videos;
CREATE POLICY "videos_delete_partner_own"
  ON public.videos FOR DELETE
  USING (auth.uid() = creator_id AND public.is_partner());

-- =============================================================================
-- COMMENTS
-- =============================================================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_public" ON public.comments;
CREATE POLICY "comments_select_public"
  ON public.comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "comments_insert_authenticated" ON public.comments;
CREATE POLICY "comments_insert_authenticated"
  ON public.comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;
CREATE POLICY "comments_delete_own"
  ON public.comments FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- RATINGS
-- =============================================================================
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ratings_select_public" ON public.ratings;
CREATE POLICY "ratings_select_public"
  ON public.ratings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "ratings_insert_own" ON public.ratings;
CREATE POLICY "ratings_insert_own"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ratings_update_own" ON public.ratings;
CREATE POLICY "ratings_update_own"
  ON public.ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "ratings_delete_own" ON public.ratings;
CREATE POLICY "ratings_delete_own"
  ON public.ratings FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- SUBSCRIPTIONS
-- =============================================================================
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

-- =============================================================================
-- VIEWS
-- =============================================================================
ALTER TABLE public.views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "views_insert_authenticated" ON public.views;
CREATE POLICY "views_insert_authenticated"
  ON public.views FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- CATEGORIES (somente leitura pública)
-- =============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public"
  ON public.categories FOR SELECT
  USING (true);

-- =============================================================================
-- STORAGE
-- =============================================================================
-- Buckets: videos, thumbnails, avatars, banners

DROP POLICY IF EXISTS "videos_public_read" ON storage.objects;
CREATE POLICY "videos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "videos_partner_upload" ON storage.objects;
CREATE POLICY "videos_partner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos'
    AND auth.uid() IS NOT NULL
    AND public.is_partner()
  );

DROP POLICY IF EXISTS "thumbnails_public_read" ON storage.objects;
CREATE POLICY "thumbnails_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "thumbnails_partner_upload" ON storage.objects;
CREATE POLICY "thumbnails_partner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND auth.uid() IS NOT NULL
    AND public.is_partner()
  );

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "avatars_upload_own" ON storage.objects;
CREATE POLICY "avatars_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "banners_public_read" ON storage.objects;
CREATE POLICY "banners_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "banners_upload_own" ON storage.objects;
CREATE POLICY "banners_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'banners'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
