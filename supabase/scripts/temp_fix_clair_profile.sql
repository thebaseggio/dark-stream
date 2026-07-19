-- Script temporário: corrige o perfil da Clair após backfill indevido com role partner.
-- Execute no SQL Editor do Supabase e remova este arquivo depois de aplicar.

UPDATE public.profiles
SET role = 'visitor', username = 'Clair'
WHERE id = '09600184-bf4a-436c-a4d8-a67673e68a56';
