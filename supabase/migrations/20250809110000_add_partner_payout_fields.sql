-- Dados de repasse para parceiros + flag opcional is_partner no perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_partner boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_pix_key text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_bank_details text;

COMMENT ON COLUMN public.profiles.payout_pix_key IS
  'Chave Pix cadastrada pelo parceiro para repasse mensal.';

COMMENT ON COLUMN public.profiles.payout_bank_details IS
  'Dados bancários alternativos (banco, agência, conta) para repasse.';
