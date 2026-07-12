-- Cole no SQL Editor do projeto Dark Stream (new)
-- https://supabase.com/dashboard/project/vrokbdihzeucbtatcbfw/sql
-- Cada linha mostra OK ou MISSING para um requisito do app.

-- Tabelas obrigatórias
SELECT 'table:' || t AS item,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  ) THEN 'OK' ELSE 'MISSING' END AS status
FROM unnest(ARRAY[
  'profiles', 'videos', 'comments', 'comment_replies',
  'ratings', 'subscriptions', 'views', 'categories'
]) AS t;

-- Funções RPC usadas pelo frontend
SELECT 'rpc:' || f AS item,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = f
  ) THEN 'OK' ELSE 'MISSING' END AS status
FROM unnest(ARRAY[
  'is_partner',
  'increment_views',
  'search_darkstream',
  'add_comment_reply',
  'edit_comment_reply',
  'get_daily_views_for_creator',
  'get_daily_subscribers_for_creator',
  'get_top_performing_video',
  'get_rating_counts_for_videos'
]) AS f;

-- Buckets de storage
SELECT 'bucket:' || b AS item,
  CASE WHEN EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = b
  ) THEN 'OK' ELSE 'MISSING' END AS status
FROM unnest(ARRAY['videos', 'thumbnails', 'avatars', 'banners']) AS b;

-- RLS habilitado
SELECT 'rls:' || c.relname AS item,
  CASE WHEN c.relrowsecurity THEN 'OK' ELSE 'MISSING' END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname IN (
    'profiles', 'videos', 'comments', 'comment_replies',
    'ratings', 'subscriptions', 'views', 'categories'
  )
ORDER BY c.relname;

-- Trigger de perfil no signup (recomendado)
SELECT 'trigger:handle_new_user' AS item,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
  ) THEN 'OK' ELSE 'MISSING (criar trigger de profiles no signup)' END AS status;
