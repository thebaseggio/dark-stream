/**
 * Popula parceiros e vídeos de teste no Supabase remoto.
 *
 * Requer no .env:
 *   VITE_SUPABASE_URL (ou SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   npm run seed:test
 */

import { createClient } from '@supabase/supabase-js';
import {
  TEST_PASSWORD,
  PARTNERS,
  INVESTIGATOR,
  INVESTIGATOR_ID,
  INVESTIGATOR_LIKES,
  VIDEOS,
  buildVideoRow,
} from './seed-catalog.mjs';

const ALL_SEED_USER_IDS = [
  ...PARTNERS.map((partner) => partner.id),
  INVESTIGATOR_ID,
];

function getEnv(name, fallbackName) {
  return process.env[name] || (fallbackName ? process.env[fallbackName] : undefined);
}

function sqlEscape(value) {
  if (value == null) return 'NULL';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function clearVideos(supabase) {
  const { data: existing, error: selectError } = await supabase.from('videos').select('id');
  if (selectError) throw selectError;
  if (!existing?.length) return;

  const ids = existing.map((row) => row.id);
  const { error } = await supabase.from('videos').delete().in('id', ids);
  if (error) throw error;
}

async function deleteSeedUsers(supabase) {
  for (const userId of ALL_SEED_USER_IDS) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error && !/not found|User not found/i.test(error.message)) {
      console.warn(`[seed] Aviso ao remover usuário ${userId}:`, error.message);
    }
  }

  const { error: profilesError } = await supabase
    .from('profiles')
    .delete()
    .in('id', ALL_SEED_USER_IDS);

  if (profilesError) throw profilesError;
}

async function upsertAuthUser(supabase, { id, email, username, password = TEST_PASSWORD }) {
  const { error: createError } = await supabase.auth.admin.createUser({
    id,
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  });

  if (createError && !/already been registered|already exists/i.test(createError.message)) {
    throw createError;
  }
}

async function upsertPartners(supabase) {
  for (const partner of PARTNERS) {
    await upsertAuthUser(supabase, partner);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: partner.id,
        username: partner.username,
        role: 'partner',
        is_partner: true,
        bio: partner.bio,
        avatar_url: partner.avatar_url,
        banner_url: partner.banner_url,
        creatorAvatar: partner.avatar_url,
        youtube_url: partner.youtube_url,
        instagram_url: partner.instagram_url,
        x_url: partner.x_url,
      }, { onConflict: 'id' });

    if (profileError) throw profileError;
    console.log(`[seed] Parceiro OK: ${partner.username}`);
  }
}

async function upsertInvestigator(supabase) {
  await upsertAuthUser(supabase, INVESTIGATOR);

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: INVESTIGATOR.id,
      username: INVESTIGATOR.username,
      role: 'visitor',
      is_partner: false,
      bio: INVESTIGATOR.bio,
    }, { onConflict: 'id' });

  if (profileError) throw profileError;
  console.log(`[seed] Investigador QA OK: ${INVESTIGATOR.email}`);
}

async function insertVideos(supabase) {
  const rows = VIDEOS.map((video, index) => buildVideoRow(video, index));
  const { error } = await supabase.from('videos').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
  console.log(`[seed] ${rows.length} vídeos inseridos/atualizados.`);
}

async function insertInvestigatorLikes(supabase) {
  const rows = INVESTIGATOR_LIKES.map((videoId) => ({
    user_id: INVESTIGATOR_ID,
    video_id: videoId,
    rating: 'like',
  }));

  const { error: deleteError } = await supabase
    .from('user_feedback')
    .delete()
    .eq('user_id', INVESTIGATOR_ID);

  if (deleteError) throw deleteError;

  const { error } = await supabase.from('user_feedback').upsert(rows, {
    onConflict: 'user_id,video_id',
  });

  if (error) throw error;
  console.log(`[seed] ${rows.length} likes do investigador QA (trilho Recomendados).`);
}

async function printSummary(supabase) {
  const categories = ['Nacionais', 'Internacionais', 'Não solucionados', 'Sobrenaturais'];

  console.log('\n[seed] Vídeos por trilho:');
  for (const category of categories) {
    const { count, error } = await supabase
      .from('videos')
      .select('id', { count: 'exact', head: true })
      .contains('category', [category]);

    if (error) {
      console.log(`  - ${category}: erro ao contar (${error.message})`);
    } else {
      console.log(`  - ${category}: ${count}`);
    }
  }
}

async function main() {
  const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Defina VITE_SUPABASE_URL (ou SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY no .env');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('[seed] Limpando vídeos existentes...');
  await clearVideos(supabase);

  console.log('[seed] Recriando contas de teste...');
  await deleteSeedUsers(supabase);
  await upsertPartners(supabase);
  await upsertInvestigator(supabase);

  console.log('[seed] Inserindo catálogo...');
  await insertVideos(supabase);
  await insertInvestigatorLikes(supabase);
  await printSummary(supabase);

  console.log(`\n[seed] Senha das contas: ${TEST_PASSWORD}`);
  console.log(`[seed] Login recomendados: ${INVESTIGATOR.email}`);
  console.log('[seed] Concluído.');
}

main().catch((error) => {
  console.error('[seed] Falhou:', error.message || error);
  process.exit(1);
});
