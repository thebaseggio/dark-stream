/**
 * Schema confirmado nas migrations:
 * - creator_id  → parceiro seguido (FK profiles)
 * - follower_id → investigador que segue (FK auth.users)
 *
 * API desligada por padrão para evitar HTTP 400 no console enquanto
 * a tabela não existir no remoto. Ative com VITE_SUBSCRIPTIONS_API=true
 * após `npx supabase db push`.
 */
import { resolveAvatarUrl } from './profileMedia';

export const SUBSCRIPTION_COLUMNS = {
  creator: 'creator_id',
  follower: 'follower_id',
};

const LOCAL_FOLLOWS_KEY = 'darkstream:local-follows';
const LOCAL_FOLLOWER_COUNTS_KEY = 'darkstream:local-follower-counts';

const USE_SUBSCRIPTIONS_API = import.meta.env.VITE_SUBSCRIPTIONS_API === 'true';

const PARTNER_PROFILE_SELECT =
  'id, username, avatar_url, banner_url, role, bio, "creatorAvatar"';

function readLocalFollows() {
  try {
    const raw = localStorage.getItem(LOCAL_FOLLOWS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readLocalFollowerCounts() {
  try {
    const raw = localStorage.getItem(LOCAL_FOLLOWER_COUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeLocalFollowerCounts(counts) {
  localStorage.setItem(LOCAL_FOLLOWER_COUNTS_KEY, JSON.stringify(counts));
}

function getLocalFollowerCount(creatorId) {
  if (!creatorId) return 0;
  const counts = readLocalFollowerCounts();
  return Math.max(0, Number(counts[creatorId]) || 0);
}

function adjustLocalFollowerCount(creatorId, delta) {
  if (!creatorId || !delta) return;
  const counts = readLocalFollowerCounts();
  counts[creatorId] = Math.max(0, (Number(counts[creatorId]) || 0) + delta);
  writeLocalFollowerCounts(counts);
}

function writeLocalFollow(creatorId, following) {
  const follows = new Set(readLocalFollows());
  const wasFollowing = follows.has(creatorId);

  if (following && !wasFollowing) {
    follows.add(creatorId);
    adjustLocalFollowerCount(creatorId, 1);
  } else if (!following && wasFollowing) {
    follows.delete(creatorId);
    adjustLocalFollowerCount(creatorId, -1);
  }

  localStorage.setItem(LOCAL_FOLLOWS_KEY, JSON.stringify([...follows]));
}

export function isLocallyFollowing(creatorId) {
  if (!creatorId) return false;
  return readLocalFollows().includes(creatorId);
}

export function toggleLocalFollow(creatorId, isCurrentlyFollowing) {
  const next = !isCurrentlyFollowing;
  writeLocalFollow(creatorId, next);
  return next;
}

export function formatFollowerLabel(count) {
  const total = Math.max(0, Number(count) || 0);
  if (total === 1) return '1 seguidor';
  return `${total.toLocaleString('pt-BR')} seguidores`;
}

async function queryFollowStatusFromApi(supabase, followerId, creatorId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(SUBSCRIPTION_COLUMNS.creator)
    .eq(SUBSCRIPTION_COLUMNS.creator, creatorId)
    .eq(SUBSCRIPTION_COLUMNS.follower, followerId)
    .maybeSingle();

  if (error) return { ok: false, following: false };
  return { ok: true, following: Boolean(data) };
}

async function mutateFollowOnApi(supabase, followerId, creatorId, isCurrentlyFollowing) {
  if (isCurrentlyFollowing) {
    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq(SUBSCRIPTION_COLUMNS.creator, creatorId)
      .eq(SUBSCRIPTION_COLUMNS.follower, followerId);

    return { ok: !error, following: false };
  }

  const { error } = await supabase
    .from('subscriptions')
    .insert({
      [SUBSCRIPTION_COLUMNS.creator]: creatorId,
      [SUBSCRIPTION_COLUMNS.follower]: followerId,
    });

  return { ok: !error, following: true };
}

/**
 * Contagem de seguidores do parceiro — API ou fallback localStorage.
 */
export async function fetchPartnerFollowerCount(supabase, creatorId) {
  if (!creatorId) return 0;

  if (!USE_SUBSCRIPTIONS_API) {
    return getLocalFollowerCount(creatorId);
  }

  try {
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq(SUBSCRIPTION_COLUMNS.creator, creatorId);

    if (error) return getLocalFollowerCount(creatorId);
    return count || 0;
  } catch {
    return getLocalFollowerCount(creatorId);
  }
}

/**
 * Parceiros que o usuário segue — com dados de perfil para exibição.
 */
export async function fetchFollowingPartners(supabase, followerId) {
  if (!followerId) return [];

  let creatorIds = [];

  if (USE_SUBSCRIPTIONS_API) {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(SUBSCRIPTION_COLUMNS.creator)
        .eq(SUBSCRIPTION_COLUMNS.follower, followerId);

      if (!error && Array.isArray(data)) {
        creatorIds = data.map((row) => row.creator_id).filter(Boolean);
      }
    } catch {
      creatorIds = [];
    }
  }

  if (creatorIds.length === 0) {
    creatorIds = readLocalFollows();
  }

  if (creatorIds.length === 0) return [];

  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(PARTNER_PROFILE_SELECT)
      .in('id', creatorIds);

    if (error || !profiles?.length) return [];

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    return creatorIds
      .map((id) => profileMap.get(id))
      .filter(Boolean)
      .map((profile) => ({
        ...profile,
        creatorAvatar: resolveAvatarUrl(profile),
      }));
  } catch {
    return [];
  }
}

/**
 * Checagem silenciosa — nunca loga erro. Retorna false em qualquer falha.
 */
export async function checkPartnerFollowStatus(supabase, followerId, creatorId) {
  if (!followerId || !creatorId) return false;

  if (!USE_SUBSCRIPTIONS_API) {
    return isLocallyFollowing(creatorId);
  }

  try {
    const result = await queryFollowStatusFromApi(supabase, followerId, creatorId);
    if (!result.ok) return isLocallyFollowing(creatorId);
    return result.following;
  } catch {
    return false;
  }
}

/**
 * Toggle silencioso — fallback local se API falhar ou estiver desligada.
 */
export async function togglePartnerFollow(supabase, followerId, creatorId, isCurrentlyFollowing) {
  if (!followerId || !creatorId) return isCurrentlyFollowing;

  if (!USE_SUBSCRIPTIONS_API) {
    return toggleLocalFollow(creatorId, isCurrentlyFollowing);
  }

  try {
    const result = await mutateFollowOnApi(
      supabase,
      followerId,
      creatorId,
      isCurrentlyFollowing
    );

    if (!result.ok) {
      return toggleLocalFollow(creatorId, isCurrentlyFollowing);
    }

    return result.following;
  } catch {
    return toggleLocalFollow(creatorId, isCurrentlyFollowing);
  }
}

export function isSubscriptionsApiEnabled() {
  return USE_SUBSCRIPTIONS_API;
}
