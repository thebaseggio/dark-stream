/**
 * Regenera supabase/seed_test_data.sql a partir de scripts/seed-catalog.mjs
 * Uso: node scripts/generate-seed-sql.mjs
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  TEST_PASSWORD,
  PARTNERS,
  INVESTIGATOR,
  INVESTIGATOR_ID,
  INVESTIGATOR_LIKES,
  VIDEOS,
  buildVideoRow,
} from './seed-catalog.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'supabase', 'seed_test_data.sql');

function sqlEscape(value) {
  if (value == null) return 'NULL';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlArray(values) {
  return `ARRAY[${values.map((value) => sqlEscape(value)).join(', ')}]::text[]`;
}

function buildAuthUserInsert(partner, createdInterval) {
  const password = partner.password || TEST_PASSWORD;

  return `  (
    ${sqlEscape(partner.id)},
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    ${sqlEscape(partner.email)},
    crypt(${sqlEscape(password)}, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    ${sqlEscape(JSON.stringify({ username: partner.username }))}::jsonb,
    now() - interval '${createdInterval}',
    now(),
    '', '', '', ''
  )`;
}

function buildIdentityInsert(userId, email) {
  return `  (
    ${sqlEscape(userId)},
    ${sqlEscape(userId)},
    ${sqlEscape(userId)},
    jsonb_build_object('sub', ${sqlEscape(userId)}, 'email', ${sqlEscape(email)}),
    'email',
    now(), now(), now()
  )`;
}

function buildProfileInsert(partner) {
  return `  (
    ${sqlEscape(partner.id)},
    ${sqlEscape(partner.username)},
    'partner',
    ${sqlEscape(partner.bio)},
    true,
    ${sqlEscape(partner.avatar_url)},
    ${sqlEscape(partner.banner_url)},
    ${sqlEscape(partner.avatar_url)},
    ${sqlEscape(partner.youtube_url)},
    ${sqlEscape(partner.instagram_url)},
    ${partner.x_url ? sqlEscape(partner.x_url) : 'NULL'}
  )`;
}

function buildVideoInsert(row) {
  return `  (
    ${sqlEscape(row.id)},
    ${sqlEscape(row.title)},
    E'${row.description.replace(/'/g, "''")}',
    ${sqlArray(row.category)},
    ${sqlArray(row.tags)},
    ${sqlEscape(row.creator_id)},
    ${sqlEscape(row.thumbnail)},
    ${sqlEscape(row.videoUrl)},
    ${row.views},
    ${row.duration},
    false,
    ${row.gostei_muito},
    ${row.gostei},
    ${row.nao_gostei},
    false,
    now() - interval '${VIDEOS.find((video) => video.id === row.id)?.daysAgo ?? 7} days'
  )`;
}

const videoRows = VIDEOS.map((video, index) => buildVideoRow(video, index));
const partnerIntervals = ['400 days', '320 days', '290 days', '260 days', '45 days'];
const allUsers = [...PARTNERS, INVESTIGATOR];
const seedEmailLines = [
  ...PARTNERS.map((partner) => `--   ${partner.email}`),
  `--   ${INVESTIGATOR.email}  (trilho "Recomendados para Você")`,
].join('\n');
const partnerPasswordLines = PARTNERS
  .filter((partner) => partner.password)
  .map((partner) => `--   ${partner.email}: ${partner.password}`)
  .join('\n');
const categoryOrder = [
  'Nacionais',
  'Internacionais',
  'Mistérios',
  'Não solucionados',
  'Solucionados',
  'Serial Killers',
  'Documentários',
  'Sobrenaturais',
];
const videoCategories = new Set(VIDEOS.flatMap((video) => video.category));
const seedCategories = categoryOrder.filter((category) => videoCategories.has(category));

const sql = `-- =============================================================================
-- Dark Stream — seed de parceiros e vídeos de teste
-- Gerado automaticamente por scripts/generate-seed-sql.mjs
-- =============================================================================
-- ${PARTNERS.length} parceiros + 1 investigador QA + ${VIDEOS.length} vídeos
--
-- Senha padrão: ${TEST_PASSWORD}
${seedEmailLines}
${partnerPasswordLines ? `--\n-- Senhas específicas:\n${partnerPasswordLines}` : ''}
--
-- EXECUÇÃO (SQL Editor ou CLI):
--   npx supabase db execute --file supabase/seed_test_data.sql --linked
-- =============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO public.categories (name) VALUES
${seedCategories.map((category) => `  (${sqlEscape(category)})`).join(',\n')}
ON CONFLICT (name) DO NOTHING;

-- ATENÇÃO: apaga TODOS os vídeos e registros dependentes (feedback, views, etc.)
TRUNCATE TABLE public.videos CASCADE;

-- Remove contas seed anteriores
DELETE FROM auth.identities
WHERE user_id IN (
  ${allUsers.map((user) => `${sqlEscape(user.id)}::uuid`).join(',\n  ')}
);

DELETE FROM auth.users
WHERE id IN (
  ${allUsers.map((user) => `${sqlEscape(user.id)}::uuid`).join(',\n  ')}
);

INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
${PARTNERS.map((partner, index) => buildAuthUserInsert(partner, partnerIntervals[index])).join(',\n')},
${buildAuthUserInsert(INVESTIGATOR, '120 days')};

INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) VALUES
${allUsers.map((user) => buildIdentityInsert(user.id, user.email)).join(',\n')};

INSERT INTO public.profiles (
  id, username, role, bio, is_partner,
  avatar_url, banner_url, "creatorAvatar",
  youtube_url, instagram_url, x_url
) VALUES
${PARTNERS.map((partner) => buildProfileInsert(partner)).join(',\n')},
  (
    ${sqlEscape(INVESTIGATOR.id)},
    ${sqlEscape(INVESTIGATOR.username)},
    'visitor',
    ${sqlEscape(INVESTIGATOR.bio)},
    false,
    NULL, NULL, NULL, NULL, NULL, NULL
  )
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  bio = EXCLUDED.bio,
  is_partner = EXCLUDED.is_partner,
  avatar_url = EXCLUDED.avatar_url,
  banner_url = EXCLUDED.banner_url,
  "creatorAvatar" = EXCLUDED."creatorAvatar",
  youtube_url = EXCLUDED.youtube_url,
  instagram_url = EXCLUDED.instagram_url,
  x_url = EXCLUDED.x_url;

INSERT INTO public.videos (
  id, title, description, category, tags, creator_id,
  thumbnail, "videoUrl", views, duration, is_short,
  gostei_muito, gostei, nao_gostei, is_community_suggestion, created_at
) VALUES
${videoRows.map((row) => buildVideoInsert(row)).join(',\n')}
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  creator_id = EXCLUDED.creator_id,
  thumbnail = EXCLUDED.thumbnail,
  "videoUrl" = EXCLUDED."videoUrl",
  views = EXCLUDED.views,
  duration = EXCLUDED.duration,
  is_short = EXCLUDED.is_short,
  gostei_muito = EXCLUDED.gostei_muito,
  gostei = EXCLUDED.gostei,
  nao_gostei = EXCLUDED.nao_gostei,
  is_community_suggestion = EXCLUDED.is_community_suggestion,
  created_at = EXCLUDED.created_at;

INSERT INTO public.user_feedback (user_id, video_id, rating)
VALUES
${INVESTIGATOR_LIKES.map((videoId) => `  (${sqlEscape(INVESTIGATOR_ID)}::uuid, ${sqlEscape(videoId)}::uuid, 'like')`).join(',\n')}
ON CONFLICT (user_id, video_id) DO UPDATE SET rating = EXCLUDED.rating;

COMMIT;

-- Verificação por trilho
SELECT cat.name AS trilho, count(v.id) AS videos
FROM public.categories cat
LEFT JOIN public.videos v
  ON v.category @> ARRAY[cat.name]::text[]
  AND v.is_short = false
  AND v.parent_video_id IS NULL
WHERE cat.name IN ('Nacionais', 'Internacionais', 'Mistérios', 'Não solucionados', 'Sobrenaturais')
GROUP BY cat.name
ORDER BY cat.name;
`;

writeFileSync(outputPath, sql, 'utf8');
console.log(`Gerado: ${outputPath}`);
