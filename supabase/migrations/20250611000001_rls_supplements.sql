-- Complemento às políticas RLS — execute após 20250611000000_recommended_rls_policies.sql
-- Corrige lacunas usadas pelo app: comment_replies, leitura de views, upsert no storage.

-- =============================================================================
-- COMMENT_REPLIES
-- =============================================================================
ALTER TABLE public.comment_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comment_replies_select_public" ON public.comment_replies;
CREATE POLICY "comment_replies_select_public"
  ON public.comment_replies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "comment_replies_delete_own" ON public.comment_replies;
CREATE POLICY "comment_replies_delete_own"
  ON public.comment_replies FOR DELETE
  USING (auth.uid() = user_id);

-- INSERT/UPDATE via RPCs (add_comment_reply, edit_comment_reply) com SECURITY DEFINER

-- =============================================================================
-- VIEWS — dashboard do parceiro lê contagem por vídeo
-- =============================================================================
DROP POLICY IF EXISTS "views_select_authenticated" ON public.views;
CREATE POLICY "views_select_authenticated"
  ON public.views FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- =============================================================================
-- STORAGE — upsert de thumbnails e upload TUS (update)
-- =============================================================================
DROP POLICY IF EXISTS "videos_partner_update" ON storage.objects;
CREATE POLICY "videos_partner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'videos'
    AND auth.uid() IS NOT NULL
    AND public.is_partner()
  )
  WITH CHECK (
    bucket_id = 'videos'
    AND auth.uid() IS NOT NULL
    AND public.is_partner()
  );

DROP POLICY IF EXISTS "thumbnails_partner_update" ON storage.objects;
CREATE POLICY "thumbnails_partner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'thumbnails'
    AND auth.uid() IS NOT NULL
    AND public.is_partner()
  )
  WITH CHECK (
    bucket_id = 'thumbnails'
    AND auth.uid() IS NOT NULL
    AND public.is_partner()
  );

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "banners_update_own" ON storage.objects;
CREATE POLICY "banners_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'banners'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
