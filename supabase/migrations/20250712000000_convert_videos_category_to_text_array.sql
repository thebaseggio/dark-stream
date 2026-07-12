-- O app salva categorias como array (CreatorUploadForm).
-- Dados legados usam text simples — converte para text[].

ALTER TABLE public.videos
  ALTER COLUMN category TYPE text[]
  USING CASE
    WHEN category IS NULL OR btrim(category) = '' THEN '{}'::text[]
    ELSE ARRAY[category]::text[]
  END;
