-- Apoio financeiro a parceiros (Dark Stream)

CREATE TABLE IF NOT EXISTS public.partner_supports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_supports_user_id_idx
  ON public.partner_supports (user_id);

CREATE INDEX IF NOT EXISTS partner_supports_partner_id_idx
  ON public.partner_supports (partner_id);

CREATE INDEX IF NOT EXISTS partner_supports_partner_status_idx
  ON public.partner_supports (partner_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS partner_supports_stripe_session_uidx
  ON public.partner_supports (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

ALTER TABLE public.partner_supports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_supports_select_own" ON public.partner_supports;
CREATE POLICY "partner_supports_select_own"
  ON public.partner_supports FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "partner_supports_select_partner" ON public.partner_supports;
CREATE POLICY "partner_supports_select_partner"
  ON public.partner_supports FOR SELECT
  USING (auth.uid() = partner_id);

DROP POLICY IF EXISTS "partner_supports_insert_own_pending" ON public.partner_supports;
CREATE POLICY "partner_supports_insert_own_pending"
  ON public.partner_supports FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Verifica se um usuário é apoiador ativo de um parceiro
CREATE OR REPLACE FUNCTION public.is_active_partner_supporter(
  p_user_id uuid,
  p_partner_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.partner_supports
    WHERE user_id = p_user_id
      AND partner_id = p_partner_id
      AND status = 'completed'
  );
$$;

-- Retorna IDs de apoiadores ativos (batch para badges em comentários/fórum)
CREATE OR REPLACE FUNCTION public.get_active_partner_supporter_ids(
  p_partner_id uuid,
  p_user_ids uuid[]
)
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    array_agg(DISTINCT ps.user_id),
    '{}'::uuid[]
  )
  FROM public.partner_supports ps
  WHERE ps.partner_id = p_partner_id
    AND ps.status = 'completed'
    AND ps.user_id = ANY(p_user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.is_active_partner_supporter(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_active_partner_supporter_ids(uuid, uuid[]) TO authenticated, anon;

COMMENT ON TABLE public.partner_supports IS 'Contribuições financeiras de investigadores a parceiros.';
COMMENT ON COLUMN public.partner_supports.amount IS 'Valor em centavos (BRL).';
