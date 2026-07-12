-- Bucket público de banners de perfil de parceiros
-- Caminho usado pelo app: {userId}/banner-{timestamp}.ext

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'banners',
    'banners',
    true,
    10485760, -- 10 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

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

DROP POLICY IF EXISTS "banners_update_own" ON storage.objects;
CREATE POLICY "banners_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'banners'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "banners_delete_own" ON storage.objects;
CREATE POLICY "banners_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'banners'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
