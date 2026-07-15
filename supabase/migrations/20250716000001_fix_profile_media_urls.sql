-- Garante colunas antes de formatar URLs (idempotente; cobre 000000 já aplicada sem banner_url)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS banner_url text;

-- Converte paths relativos salvos por engano em URLs públicas completas
-- Projeto: vrokbdihzeucbtatcbfw

UPDATE public.profiles
SET avatar_url = 'https://vrokbdihzeucbtatcbfw.supabase.co/storage/v1/object/public/avatars/' || TRIM(LEADING '/' FROM avatar_url)
WHERE avatar_url IS NOT NULL
  AND avatar_url NOT LIKE 'http%';

UPDATE public.profiles
SET "creatorAvatar" = 'https://vrokbdihzeucbtatcbfw.supabase.co/storage/v1/object/public/avatars/' || TRIM(LEADING '/' FROM "creatorAvatar")
WHERE "creatorAvatar" IS NOT NULL
  AND "creatorAvatar" NOT LIKE 'http%';

UPDATE public.profiles
SET "creatorAvatar" = avatar_url
WHERE avatar_url IS NOT NULL
  AND avatar_url LIKE 'http%'
  AND ("creatorAvatar" IS NULL OR "creatorAvatar" NOT LIKE 'http%');

UPDATE public.profiles
SET banner_url = 'https://vrokbdihzeucbtatcbfw.supabase.co/storage/v1/object/public/banners/' || TRIM(LEADING '/' FROM banner_url)
WHERE banner_url IS NOT NULL
  AND banner_url NOT LIKE 'http%';
