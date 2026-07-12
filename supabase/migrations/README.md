# Migrations do Supabase

## Sincronizar schema existente (recomendado)

O projeto já tem banco configurado no Supabase. Para exportar o schema **real** (tabelas, RLS, functions):

```bash
npx supabase login
npx supabase link --project-ref vrokbdihzeucbtatcbfw
npx supabase db pull
```

Será solicitada a **senha do banco** (Dashboard → Settings → Database).

Isso gera arquivos em `supabase/migrations/` refletindo o estado atual do remoto.

## Políticas de segurança recomendadas

Arquivos de políticas RLS (aplicar nesta ordem):

1. `20250611000000_recommended_rls_policies.sql`
2. `20250611000001_rls_supplements.sql` — comment_replies, views SELECT, storage UPDATE
3. `20250611000002_categories_table.sql` — tabela categories + seed das 7 categorias
4. `20250712000001_storage_buckets.sql` — buckets públicos (videos, thumbnails, avatars) + políticas
5. `20250712000002_storage_banners_bucket.sql` — bucket banners + políticas
6. `20250712000003_create_profile_on_signup.sql` — trigger de profile no signup + backfill

Use `verify_setup.sql` no SQL Editor para checar tabelas, RPCs, buckets e RLS.

Revise no Dashboard antes de aplicar:

```bash
# Aplicar localmente (dev) ou via SQL Editor no Dashboard
npx supabase db push
```

## Checklist de auditoria RLS

No [Supabase Dashboard](https://supabase.com/dashboard/project/vrokbdihzeucbtatcbfw/auth/policies), confirme:

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
