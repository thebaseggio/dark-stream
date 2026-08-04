-- Campos de billing Stripe em profiles

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_method_brand text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payment_method_last4 text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;
