-- Security hardening — Dark Stream
-- Ativa RLS em todas as tabelas public, reforça UPDATE/DELETE em profiles e videos,
-- e impede escalação de privilégio via colunas sensíveis do perfil.

-- =============================================================================
-- 1. RLS em todas as tabelas do schema public
-- =============================================================================
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname NOT LIKE 'pg_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tbl.table_name);
  END LOOP;
END $$;

-- =============================================================================
-- 2. PROFILES — UPDATE/DELETE restritos a auth.uid()
-- =============================================================================
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Impede que usuários autenticados alterem campos administrativos/billing via client
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Alteração de role não permitida';
  END IF;

  IF NEW.is_partner IS DISTINCT FROM OLD.is_partner THEN
    RAISE EXCEPTION 'Alteração de is_partner não permitida';
  END IF;

  IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
    RAISE EXCEPTION 'Alteração de subscription_status não permitida';
  END IF;

  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
    RAISE EXCEPTION 'Alteração de stripe_customer_id não permitida';
  END IF;

  IF NEW.payment_method_brand IS DISTINCT FROM OLD.payment_method_brand THEN
    RAISE EXCEPTION 'Alteração de payment_method_brand não permitida';
  END IF;

  IF NEW.payment_method_last4 IS DISTINCT FROM OLD.payment_method_last4 THEN
    RAISE EXCEPTION 'Alteração de payment_method_last4 não permitida';
  END IF;

  IF NEW.subscription_period_end IS DISTINCT FROM OLD.subscription_period_end THEN
    RAISE EXCEPTION 'Alteração de subscription_period_end não permitida';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_sensitive_columns ON public.profiles;
CREATE TRIGGER protect_profile_sensitive_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_columns();

-- =============================================================================
-- 3. VIDEOS — UPDATE/DELETE restritos ao criador (auth.uid() = creator_id)
-- =============================================================================
DROP POLICY IF EXISTS "videos_update_partner_own" ON public.videos;
CREATE POLICY "videos_update_partner_own"
  ON public.videos FOR UPDATE
  USING (auth.uid() = creator_id AND public.is_partner())
  WITH CHECK (auth.uid() = creator_id AND public.is_partner());

DROP POLICY IF EXISTS "videos_delete_partner_own" ON public.videos;
CREATE POLICY "videos_delete_partner_own"
  ON public.videos FOR DELETE
  USING (auth.uid() = creator_id AND public.is_partner());

-- =============================================================================
-- 4. COMMENTS — UPDATE próprio (lacuna anterior)
-- =============================================================================
DROP POLICY IF EXISTS "comments_update_own" ON public.comments;
CREATE POLICY "comments_update_own"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 5. COMMENT_REPLIES — UPDATE próprio (complemento às RPCs)
-- =============================================================================
DROP POLICY IF EXISTS "comment_replies_update_own" ON public.comment_replies;
CREATE POLICY "comment_replies_update_own"
  ON public.comment_replies FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 6. VIEWS — restringe INSERT ao próprio user_id quando informado
-- =============================================================================
DROP POLICY IF EXISTS "views_insert_authenticated" ON public.views;
CREATE POLICY "views_insert_authenticated"
  ON public.views FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (user_id IS NULL OR auth.uid() = user_id)
  );

-- =============================================================================
-- 7. Revoga mutações globais de anon
-- =============================================================================
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;
