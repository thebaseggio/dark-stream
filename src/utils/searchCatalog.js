import { resolveAvatarUrl } from './partnerProfile';

const EMPTY_CATALOG = Object.freeze({ partners: [], videos: [] });

export function normalizeSearchTerm(rawQuery) {
  if (rawQuery == null || typeof rawQuery !== 'string') return '';
  return rawQuery.trim().toLowerCase();
}

export function escapeIlikePattern(term) {
  return term.replace(/[%_\\]/g, '\\$&');
}

export function buildIlikePattern(term) {
  const normalized = normalizeSearchTerm(term);
  if (!normalized) return null;
  return `%${escapeIlikePattern(normalized)}%`;
}

function mergeVideosById(...lists) {
  const map = new Map();
  lists.flat().forEach((video) => {
    if (video?.id) map.set(video.id, video);
  });
  return Array.from(map.values());
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

const VIDEO_SEARCH_SELECT =
  'id, title, thumbnail, description, tags, views, created_at, creator_id (id, username, "creatorAvatar", role)';

const PARTNER_SEARCH_SELECT =
  'id, username, bio, role, avatar_url, "creatorAvatar"';

export async function searchPartners(supabase, term, limit = 12) {
  const pattern = buildIlikePattern(term);
  if (!pattern || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(PARTNER_SEARCH_SELECT)
      .eq('role', 'partner')
      .or(`username.ilike.${pattern},bio.ilike.${pattern}`)
      .order('username', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar parceiros:', error);
      return [];
    }

    return safeArray(data);
  } catch (error) {
    console.error('Erro inesperado ao buscar parceiros:', error);
    return [];
  }
}

export async function searchVideosByText(supabase, term, limit = 24) {
  const pattern = buildIlikePattern(term);
  if (!pattern || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('videos')
      .select(VIDEO_SEARCH_SELECT)
      .eq('is_short', false)
      .is('parent_video_id', null)
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar vídeos por texto:', error);
      return [];
    }

    return safeArray(data);
  } catch (error) {
    console.error('Erro inesperado ao buscar vídeos por texto:', error);
    return [];
  }
}

export async function searchVideosByPartnerIds(supabase, partnerIds, limit = 24) {
  if (!supabase || !Array.isArray(partnerIds) || partnerIds.length === 0) return [];

  try {
    const { data, error } = await supabase
      .from('videos')
      .select(VIDEO_SEARCH_SELECT)
      .eq('is_short', false)
      .is('parent_video_id', null)
      .in('creator_id', partnerIds)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar vídeos do parceiro:', error);
      return [];
    }

    return safeArray(data);
  } catch (error) {
    console.error('Erro inesperado ao buscar vídeos do parceiro:', error);
    return [];
  }
}

export async function searchCatalog(supabase, rawQuery) {
  const term = normalizeSearchTerm(rawQuery);
  if (!term || !supabase) {
    return { partners: [], videos: [] };
  }

  try {
    const [partners, videosByText] = await Promise.all([
      searchPartners(supabase, term),
      searchVideosByText(supabase, term),
    ]);

    const partnerIds = safeArray(partners)
      .map((partner) => partner?.id)
      .filter(Boolean);
    const videosByPartner = await searchVideosByPartnerIds(supabase, partnerIds);

    return {
      partners: safeArray(partners),
      videos: mergeVideosById(safeArray(videosByText), safeArray(videosByPartner)),
    };
  } catch (error) {
    console.error('Erro inesperado na busca do catálogo:', error);
    return { partners: [], videos: [] };
  }
}

export function getPartnerAvatarUrl(partner) {
  return (
    resolveAvatarUrl(partner)
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner?.username?.charAt(0) || 'P')}&background=111111&color=f1c40f&bold=true`
  );
}

export function videoMatchesTags(video, term) {
  if (!Array.isArray(video?.tags)) return false;
  const normalized = normalizeSearchTerm(term);
  return video.tags.some((tag) => tag.toLowerCase().includes(normalized));
}

/** Busca rápida para dropdown da Searchbar (casos + parceiros). */
export async function searchQuickResults(supabase, rawQuery, { videoLimit = 8, partnerLimit = 8 } = {}) {
  const term = normalizeSearchTerm(rawQuery);
  if (term.length <= 2 || !supabase) {
    return { videos: [], partners: [] };
  }

  const pattern = buildIlikePattern(term);
  if (!pattern) {
    return { videos: [], partners: [] };
  }

  try {
    const [videosRes, tagPoolRes, partners] = await Promise.all([
      supabase
        .from('videos')
        .select('id, title, thumbnail, tags, is_short')
        .eq('is_short', false)
        .is('parent_video_id', null)
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('videos')
        .select('id, title, thumbnail, tags, is_short')
        .eq('is_short', false)
        .is('parent_video_id', null)
        .not('tags', 'eq', '{}')
        .order('created_at', { ascending: false })
        .limit(80),
      searchPartners(supabase, term, partnerLimit),
    ]);

    const titleDescMatches = safeArray(videosRes?.data);
    const tagMatches = safeArray(tagPoolRes?.data).filter((video) => videoMatchesTags(video, term));
    const safePartners = safeArray(partners);
    const partnerVideos = await searchVideosByPartnerIds(
      supabase,
      safePartners.map((partner) => partner?.id).filter(Boolean),
      12,
    );

    if (videosRes?.error) console.error('Erro ao buscar casos:', videosRes.error);
    if (tagPoolRes?.error) console.error('Erro ao buscar tags:', tagPoolRes.error);

    return {
      videos: mergeVideosById(titleDescMatches, tagMatches, safeArray(partnerVideos)).slice(0, videoLimit),
      partners: safePartners.slice(0, partnerLimit),
    };
  } catch (error) {
    console.error('Erro inesperado na busca rápida:', error);
    return { videos: [], partners: [] };
  }
}

export { EMPTY_CATALOG };
