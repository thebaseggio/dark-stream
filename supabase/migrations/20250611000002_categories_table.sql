-- Tabela de categorias para ordenar as fileiras na página Explorar (/casos)
-- Os vídeos guardam categorias no array videos.category (text[])

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.categories (name) VALUES
  ('Nacionais'),
  ('Internacionais'),
  ('Não solucionados'),
  ('Solucionados'),
  ('Serial Killers'),
  ('Documentários'),
  ('Sobrenaturais')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public"
  ON public.categories FOR SELECT
  USING (true);
