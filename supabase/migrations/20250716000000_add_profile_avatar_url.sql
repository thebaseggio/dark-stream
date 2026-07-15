-- Colunas de mídia do perfil (avatar e banner)
-- Deve rodar ANTES de 20250716000001_fix_profile_media_urls.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url text;

-- Sincroniza avatar_url a partir de creatorAvatar (dados legados)
UPDATE public.profiles
SET avatar_url = "creatorAvatar"
WHERE avatar_url IS NULL
  AND "creatorAvatar" IS NOT NULL;
