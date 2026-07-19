-- Colunas de redes sociais do perfil (usadas em ProfileEditor e PartnerProfile)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS youtube_url text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS instagram_url text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS x_url text;
