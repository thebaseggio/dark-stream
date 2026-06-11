# Migrations do Supabase

## Sincronizar schema existente (recomendado)

O projeto já tem banco configurado no Supabase. Para exportar o schema **real** (tabelas, RLS, functions):

```bash
npx supabase login
npx supabase link --project-ref baqvszumalgtgaepxwqq
npx supabase db pull
```

Será solicitada a **senha do banco** (Dashboard → Settings → Database).

Isso gera arquivos em `supabase/migrations/` refletindo o estado atual do remoto.

## Políticas de segurança recomendadas

O arquivo `20250611000000_recommended_rls_policies.sql` contém políticas RLS **alinhadas ao código do app**. Revise no Dashboard antes de aplicar:

```bash
# Aplicar localmente (dev) ou via SQL Editor no Dashboard
npx supabase db push
```

## Checklist de auditoria RLS

No [Supabase Dashboard](https://supabase.com/dashboard/project/baqvszumalgtgaepxwqq/auth/policies), confirme:

| Recurso | Leitura | Escrita |
|---------|---------|---------|
| `videos` | Pública | Apenas `role = partner`, `creator_id = auth.uid()` |
| `profiles` | Pública | Apenas `id = auth.uid()` |
| `comments` | Pública | Autenticado, `user_id = auth.uid()` |
| `ratings` | Próprias | Autenticado, `user_id = auth.uid()` |
| `subscriptions` | Próprias | Autenticado, `follower_id = auth.uid()` |
| `views` | — | Insert autenticado |
| Storage `videos` | Pública | Upload apenas parceiros |
| Storage `thumbnails` | Pública | Upload apenas parceiros |
| Storage `avatars`, `banners` | Pública | Upload pasta `{user_id}/` |
