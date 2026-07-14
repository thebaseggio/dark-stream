-- Mural de pistas / avisos do QG do parceiro

CREATE TABLE IF NOT EXISTS public.partner_pistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'pista' CHECK (post_type IN ('pista', 'aviso', 'bastidor')),
  pin_color text NOT NULL DEFAULT 'yellow' CHECK (pin_color IN ('yellow', 'pink', 'blue', 'green')),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_pistas_partner_id_idx ON public.partner_pistas (partner_id);
CREATE INDEX IF NOT EXISTS partner_pistas_post_type_idx ON public.partner_pistas (post_type);
CREATE INDEX IF NOT EXISTS partner_pistas_created_at_idx ON public.partner_pistas (created_at DESC);

ALTER TABLE public.partner_pistas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_pistas_select_public" ON public.partner_pistas;
CREATE POLICY "partner_pistas_select_public"
  ON public.partner_pistas FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "partner_pistas_insert_partner_own" ON public.partner_pistas;
CREATE POLICY "partner_pistas_insert_partner_own"
  ON public.partner_pistas FOR INSERT
  WITH CHECK (
    auth.uid() = partner_id
    AND public.is_partner()
  );

DROP POLICY IF EXISTS "partner_pistas_update_partner_own" ON public.partner_pistas;
CREATE POLICY "partner_pistas_update_partner_own"
  ON public.partner_pistas FOR UPDATE
  USING (auth.uid() = partner_id AND public.is_partner())
  WITH CHECK (auth.uid() = partner_id AND public.is_partner());

DROP POLICY IF EXISTS "partner_pistas_delete_partner_own" ON public.partner_pistas;
CREATE POLICY "partner_pistas_delete_partner_own"
  ON public.partner_pistas FOR DELETE
  USING (auth.uid() = partner_id AND public.is_partner());
