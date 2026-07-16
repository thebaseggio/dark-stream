-- Habilita Supabase Realtime na tabela subscriptions para contadores de seguidores ao vivo.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
  END IF;
END $$;
