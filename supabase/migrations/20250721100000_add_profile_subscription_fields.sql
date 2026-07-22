-- Colunas de assinatura do investigador em profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_plan text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text;
