-- Cria buckets públicos de storage para o Dark Stream (new)
-- Execute após as migrations de RLS (is_partner deve existir)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'videos',
    'videos',
    true,
    524288000, -- 500 MB
    ARRAY['video/mp4', 'video/webm', 'video/quicktime']
  ),
  (
    'thumbnails',
    'thumbnails',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'avatars',
    'avatars',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS em storage.objects já vem habilitado pelo Supabase.

-- =============================================================================
-- LEITURA PÚBLICA (todos os buckets)
-- =============================================================================
DROP POLICY IF EXISTS "videos_public_read" ON storage.objects;
CREATE POLICY "videos_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

DROP POLICY IF EXISTS "thumbnails_public_read" ON storage.objects;
CREATE POLICY "thumbnails_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'thumbnails');

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- =============================================================================
-- UPLOAD — parceiros (videos e thumbnails)
-- Caminhos usados pelo app: video-{userId}-... e thumb-{userId}-...
-- =============================================================================
DROP POLICY IF EXISTS "videos_partner_upload" ON storage.objects;
CREATE POLICY "videos_partner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'videos'
    AND auth.uid() IS NOT NULL
    AND public.is_partner()
  );

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

DROP POLICY IF EXISTS "videos_partner_delete" ON storage.objects;
CREATE POLICY "videos_partner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'videos'
    AND auth.uid() IS NOT NULL
    AND public.is_partner()
  );

DROP POLICY IF EXISTS "thumbnails_partner_upload" ON storage.objects;
CREATE POLICY "thumbnails_partner_upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'thumbnails'
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

DROP POLICY IF EXISTS "thumbnails_partner_delete" ON storage.objects;
CREATE POLICY "thumbnails_partner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'thumbnails'
    AND auth.uid() IS NOT NULL
    AND public.is_partner()
  );

-- =============================================================================
-- UPLOAD — avatars (qualquer usuário autenticado, pasta própria)
-- Caminho usado pelo app: {userId}/avatar-{timestamp}.ext
-- =============================================================================
DROP POLICY IF EXISTS "avatars_upload_own" ON storage.objects;
CREATE POLICY "avatars_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_update_own" ON storage.objects;
CREATE POLICY "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "avatars_delete_own" ON storage.objects;
CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
