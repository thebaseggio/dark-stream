-- Arquivos e evidências anexos a cada caso (vídeo)

CREATE TABLE IF NOT EXISTS public.case_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(trim(title)) > 0),
  file_url text NOT NULL CHECK (char_length(trim(file_url)) > 0),
  type text NOT NULL CHECK (type IN ('document', 'image', 'link')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS case_files_video_id_idx ON public.case_files (video_id);
CREATE INDEX IF NOT EXISTS case_files_created_at_idx ON public.case_files (created_at ASC);

ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "case_files_select_public" ON public.case_files;
CREATE POLICY "case_files_select_public"
  ON public.case_files FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "case_files_insert_partner_own_video" ON public.case_files;
CREATE POLICY "case_files_insert_partner_own_video"
  ON public.case_files FOR INSERT
  WITH CHECK (
    public.is_partner()
    AND EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_id AND v.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "case_files_update_partner_own_video" ON public.case_files;
CREATE POLICY "case_files_update_partner_own_video"
  ON public.case_files FOR UPDATE
  USING (
    public.is_partner()
    AND EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = case_files.video_id AND v.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_partner()
    AND EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = video_id AND v.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "case_files_delete_partner_own_video" ON public.case_files;
CREATE POLICY "case_files_delete_partner_own_video"
  ON public.case_files FOR DELETE
  USING (
    public.is_partner()
    AND EXISTS (
      SELECT 1 FROM public.videos v
      WHERE v.id = case_files.video_id AND v.creator_id = auth.uid()
    )
  );

COMMENT ON TABLE public.case_files IS 'Mídias e documentos anexos exibidos na página do caso.';
COMMENT ON COLUMN public.case_files.type IS 'document | image | link';
