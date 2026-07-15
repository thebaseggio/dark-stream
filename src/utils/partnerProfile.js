import { PROFILE_FIELDS_SELECT, resolveAvatarUrl, resolveBannerUrl } from './profileMedia';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeSlug(slug) {
  if (slug == null || typeof slug !== 'string') return '';

  try {
    return decodeURIComponent(slug).trim();
  } catch {
    return slug.trim();
  }
}

/** Escapa caracteres especiais do ILIKE para match exato. */
function escapeIlikeExact(value) {
  return value.replace(/[%_\\]/g, '\\$&');
}

function buildUsernameVariants(slug) {
  const variants = new Set();
  const normalized = normalizeSlug(slug);

  if (!normalized) return [];

  variants.add(normalized);
  variants.add(normalized.replace(/-/g, ' '));
  variants.add(normalized.replace(/\+/g, ' '));

  return Array.from(variants).filter(Boolean);
}

async function queryProfile(supabase, { byId, value, requirePartner }) {
  let query = supabase.from('profiles').select(PROFILE_FIELDS_SELECT);

  if (requirePartner) {
    query = query.eq('role', 'partner');
  }

  if (byId) {
    query = query.eq('id', value);
  } else {
    query = query.ilike('username', escapeIlikeExact(value));
  }

  return query.maybeSingle();
}

/**
 * Busca perfil de parceiro por UUID ou username (slug da rota).
 * Tenta múltiplas estratégias antes de retornar null.
 */
export async function fetchPartnerProfileBySlug(supabase, slug) {
  const normalized = normalizeSlug(slug);

  if (!normalized) {
    return { data: null, error: new Error('Identificador do parceiro ausente.') };
  }

  const attempts = [];

  if (UUID_REGEX.test(normalized)) {
    attempts.push(
      { byId: true, value: normalized, requirePartner: true },
      { byId: true, value: normalized, requirePartner: false },
    );
  } else {
    for (const username of buildUsernameVariants(normalized)) {
      attempts.push(
        { byId: false, value: username, requirePartner: true },
        { byId: false, value: username, requirePartner: false },
      );
    }
  }

  let lastError = null;

  for (const attempt of attempts) {
    const { data, error } = await queryProfile(supabase, attempt);

    if (error) {
      lastError = error;
      continue;
    }

    if (data) {
      return { data, error: null };
    }
  }

  return { data: null, error: lastError };
}

export function formatPartnerVideoForCard(video, partnerProfile) {
  const thumbnail = video.thumbnail_url || video.thumbnail || null;

  return {
    ...video,
    thumbnail,
    thumbnail_url: thumbnail,
    creator_username: partnerProfile?.username,
    creator_avatar_url: resolveAvatarUrl(partnerProfile),
    creator_role: partnerProfile?.role,
  };
}

/**
 * Gera a rota do perfil público do parceiro.
 * Prioriza /parceiros/:username; fallback seguro para /parceiro/:id (UUID).
 */
export function getPartnerProfilePath(partner) {
  if (!partner) return null;

  const username = (
    partner.username
    || partner.creator_username
    || partner.creator_id?.username
  )?.trim();

  if (username) {
    return `/parceiros/${encodeURIComponent(username)}`;
  }

  const id =
    partner.id
    || partner.creator_id?.id
    || (typeof partner.creator_id === 'string' ? partner.creator_id : null);

  if (id) {
    return `/parceiro/${id}`;
  }

  return null;
}

export { resolveAvatarUrl, resolveBannerUrl };
