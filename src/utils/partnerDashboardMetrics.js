import { buildPeriodStartIso } from './opsInsights';
import { canAccessPartnerDashboard, isPartnerAccount } from './partnerAccess';

/** Repasse estimado por hora assistida (RPM simplificado). */
export const REVENUE_PER_HOUR_BRL = 0.05;

/** Colunas confirmadas no schema / usadas em PartnerProfile e Explore. */
const VIDEO_CORE_SELECT = [
  'id',
  'title',
  'thumbnail',
  'views',
  'created_at',
  'videoUrl',
  'duration',
  'is_short',
  'short_type',
  'parent_video_id',
  'category',
  'creator_id',
  'is_community_suggestion',
].join(', ');

export { canAccessPartnerDashboard, isPartnerAccount };

export function isDashboardPrivileged(profile) {
  return profile?.role === 'admin' || profile?.role === 'tester';
}

export function isPartnerCreator(profile) {
  return profile?.role === 'partner' || isDashboardPrivileged(profile);
}

export function getVideoPublishStatus(video) {
  if (video?.videoUrl || video?.video_url) return 'published';
  return 'processing';
}

export function formatVideoDurationLabel(video) {
  if (video?.duration) return video.duration;
  if (video?.runtime) return video.runtime;

  const seconds = Number(video?.duration_seconds);
  if (!seconds || seconds <= 0) return '—';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function percentChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function sumProgressSeconds(rows = []) {
  return rows.reduce((sum, row) => sum + (Number(row.progress_seconds) || 0), 0);
}

function sumVideoViews(videos = []) {
  return videos.reduce((sum, video) => sum + (Number(video.views) || 0), 0);
}

function averageRetentionPercent(rows = []) {
  const valid = rows.filter(
    (row) => Number(row.duration_seconds) > 0 && Number(row.progress_seconds) >= 0,
  );

  if (!valid.length) return 0;

  const total = valid.reduce((sum, row) => {
    const pct = (Number(row.progress_seconds) / Number(row.duration_seconds)) * 100;
    return sum + Math.min(100, pct);
  }, 0);

  return Math.round(total / valid.length);
}

function averageCompletionRate(rows = []) {
  const valid = rows.filter((row) => Number(row.duration_seconds) > 0);

  if (!valid.length) return 0;

  const completed = valid.filter(
    (row) => Number(row.progress_seconds) / Number(row.duration_seconds) >= 0.8,
  ).length;

  return Math.round((completed / valid.length) * 100);
}

function countWatchlistByVideoId(rows = []) {
  const map = new Map();
  rows.forEach((row) => {
    if (!row.video_id) return;
    map.set(row.video_id, (map.get(row.video_id) || 0) + 1);
  });
  return map;
}

function groupViewsByDay(viewsRows = [], periodDays) {
  const buckets = [];
  const now = new Date();

  for (let i = periodDays - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);
    buckets.push({
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      count: 0,
    });
  }

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  viewsRows.forEach((row) => {
    if (!row.created_at) return;
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const bucket = bucketMap.get(key);
    if (bucket) bucket.count += 1;
  });

  return buckets;
}

function getVideoSortTimestamp(video) {
  const raw = video?.created_at || video?.published_at || video?.date || video?.updated_at;
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function sortVideosNewestFirst(videos = []) {
  return [...videos].sort((a, b) => getVideoSortTimestamp(b) - getVideoSortTimestamp(a));
}

function dedupeVideosById(videos = []) {
  const map = new Map();
  videos.forEach((video) => {
    if (video?.id) map.set(video.id, video);
  });
  return sortVideosNewestFirst([...map.values()]);
}

function isCatalogCaseVideo(video) {
  if (!video) return false;
  if (video.is_short === true) return false;
  if (video.parent_video_id) return false;
  return true;
}

function filterCatalogVideos(videos = [], strict = true) {
  const filtered = strict ? videos.filter(isCatalogCaseVideo) : videos.filter(Boolean);
  return dedupeVideosById(filtered);
}

async function runVideoQuery(buildQuery, context = 'vídeos do parceiro') {
  try {
    const { data, error } = await buildQuery();

    if (error) {
      console.error(`Erro na query de ${context}:`, error);
      return [];
    }

    return sortVideosNewestFirst(data || []);
  } catch (error) {
    console.error(`Erro na query de ${context}:`, error);
    return [];
  }
}

async function fetchVideosWithSelect(supabase, selectClause, applyFilters, context) {
  const primary = await runVideoQuery(
    () => {
      let query = supabase.from('videos').select(selectClause);
      query = applyFilters(query);
      return query;
    },
    `${context} (select específico)`,
  );

  if (primary.length) return primary;

  return runVideoQuery(
    () => {
      let query = supabase.from('videos').select('*');
      query = applyFilters(query);
      return query.limit(500);
    },
    `${context} (fallback *)`,
  );
}

async function fetchVideosByCreatorIds(supabase, creatorIds, strictCatalog = true) {
  const ids = [...new Set(creatorIds.filter(Boolean))];
  if (!ids.length) return [];

  const rows = await fetchVideosWithSelect(
    supabase,
    VIDEO_CORE_SELECT,
    (query) => query.in('creator_id', ids),
    'vídeos por creator_id',
  );

  return filterCatalogVideos(rows, strictCatalog);
}

async function fetchProfileIdsByUsername(supabase, username) {
  if (!username) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, role')
    .ilike('username', username);

  if (error) {
    console.error('Erro ao resolver perfis por username:', error);
    return [];
  }

  return (data || []).map((row) => row.id);
}

async function fetchVideosByCreatorId(supabase, userId, strictCatalog = true) {
  if (!userId) return [];

  const rows = await fetchVideosWithSelect(
    supabase,
    VIDEO_CORE_SELECT,
    (query) => query.eq('creator_id', userId),
    'vídeos do criador logado',
  );

  return filterCatalogVideos(rows, strictCatalog);
}

async function fetchVideosByAlternateOwnerKeys(supabase, userId, profile) {
  const username = profile?.username?.trim();
  const attempts = [];

  if (userId) {
    attempts.push(
      { label: 'vídeos por partner_id', apply: (query) => query.eq('partner_id', userId) },
      { label: 'vídeos por author_id', apply: (query) => query.eq('author_id', userId) },
    );
  }

  if (username) {
    attempts.push(
      { label: 'vídeos por author_name', apply: (query) => query.ilike('author_name', username) },
      { label: 'vídeos por partner_name', apply: (query) => query.ilike('partner_name', username) },
      { label: 'vídeos por author_name exato', apply: (query) => query.eq('author_name', username) },
      { label: 'vídeos por partner_name exato', apply: (query) => query.eq('partner_name', username) },
    );
  }

  const merged = [];

  for (const attempt of attempts) {
    const rows = await fetchVideosWithSelect(
      supabase,
      VIDEO_CORE_SELECT,
      attempt.apply,
      attempt.label,
    );

    if (rows.length) merged.push(...rows);
  }

  return filterCatalogVideos(merged, false);
}

async function fetchPrivilegedPartnerVideos(supabase, userId, profile) {
  const alternate = await fetchVideosByAlternateOwnerKeys(supabase, userId, profile);
  if (alternate.length) return alternate;

  const byCreator = await fetchVideosByCreatorId(supabase, userId, false);
  if (byCreator.length) return byCreator;

  if (profile?.username) {
    const profileIds = await fetchProfileIdsByUsername(supabase, profile.username);
    const ownerIds = [...new Set([userId, ...profileIds].filter(Boolean))];
    const byProfiles = await fetchVideosByCreatorIds(supabase, ownerIds, false);
    if (byProfiles.length) return byProfiles;
  }

  const allRows = await fetchVideosWithSelect(
    supabase,
    VIDEO_CORE_SELECT,
    (query) => query.limit(500),
    'todos os vídeos (admin)',
  );

  const strictCatalog = filterCatalogVideos(allRows, true);
  return strictCatalog.length ? strictCatalog : filterCatalogVideos(allRows, false);
}

async function fetchPartnerVideoRows(supabase, userId, profile) {
  if (isDashboardPrivileged(profile)) {
    return fetchPrivilegedPartnerVideos(supabase, userId, profile);
  }

  const strategies = [
    () => fetchVideosByCreatorId(supabase, userId, true),
    () => fetchVideosByCreatorId(supabase, userId, false),
  ];

  if (profile?.username) {
    strategies.push(async () => {
      const profileIds = await fetchProfileIdsByUsername(supabase, profile.username);
      const ownerIds = [...new Set([userId, ...profileIds].filter(Boolean))];
      return fetchVideosByCreatorIds(supabase, ownerIds, true);
    });

    strategies.push(async () => {
      const profileIds = await fetchProfileIdsByUsername(supabase, profile.username);
      const ownerIds = [...new Set([userId, ...profileIds].filter(Boolean))];
      return fetchVideosByCreatorIds(supabase, ownerIds, false);
    });
  }

  strategies.push(() => fetchVideosByAlternateOwnerKeys(supabase, userId, profile));

  for (const strategy of strategies) {
    const videos = await strategy();
    if (videos.length) {
      console.info('[PartnerDashboard] Vídeos carregados:', videos.length);
      return videos;
    }
  }

  console.warn('[PartnerDashboard] Nenhum vídeo encontrado para o parceiro logado.', {
    userId,
    username: profile?.username,
  });

  return [];
}

async function fetchWatchHistoryForVideos(supabase, videoIds, periodStart) {
  if (!videoIds.length) return [];

  let query = supabase
    .from('user_watch_history')
    .select('video_id, progress_seconds, duration_seconds, updated_at')
    .in('video_id', videoIds);

  if (periodStart) {
    query = query.gte('updated_at', periodStart);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar histórico de visualização:', error);
    return [];
  }

  return data || [];
}

async function fetchWatchlistForVideos(supabase, videoIds, periodStart) {
  if (!videoIds.length) return [];

  let query = supabase
    .from('user_watchlist')
    .select('video_id, created_at')
    .in('video_id', videoIds);

  if (periodStart) {
    query = query.gte('created_at', periodStart);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar favoritos do parceiro:', error);
    return [];
  }

  return data || [];
}

async function fetchViewsForVideos(supabase, videoIds, periodStart, periodEnd = null) {
  if (!videoIds.length) return [];

  let query = supabase
    .from('views')
    .select('id, created_at, video_id')
    .in('video_id', videoIds);

  if (periodStart) {
    query = query.gte('created_at', periodStart);
  }
  if (periodEnd) {
    query = query.lt('created_at', periodEnd);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar views do período:', error);
    return [];
  }

  return data || [];
}

export async function fetchPartnerDashboardData(supabase, userId, profile, periodDays = 30) {
  const empty = {
    metrics: {
      totalViews: 0,
      viewsChangePercent: 0,
      hoursWatched: 0,
      estimatedRevenue: 0,
      averageRetention: 0,
      favoritedCount: 0,
      completionRate: 0,
      viewsTrend: [],
    },
    videos: [],
    isAdminView: isDashboardPrivileged(profile),
  };

  if (!userId || !canAccessPartnerDashboard(profile)) return empty;

  const videos = await fetchPartnerVideoRows(supabase, userId, profile);
  const videoIds = videos.map((video) => video.id);

  if (!videoIds.length) {
    return empty;
  }

  const periodStart = buildPeriodStartIso(periodDays);
  const previousStart = buildPeriodStartIso(periodDays * 2);

  const [
    currentViewsRows,
    previousViewsRows,
    historyRows,
    watchlistRows,
    lifetimeWatchlistRows,
  ] = await Promise.all([
    fetchViewsForVideos(supabase, videoIds, periodStart),
    periodStart && previousStart
      ? fetchViewsForVideos(supabase, videoIds, previousStart, periodStart)
      : Promise.resolve([]),
    fetchWatchHistoryForVideos(supabase, videoIds, periodStart),
    fetchWatchlistForVideos(supabase, videoIds, periodStart),
    fetchWatchlistForVideos(supabase, videoIds, null),
  ]);

  const totalViews = sumVideoViews(videos);
  const progressSeconds = sumProgressSeconds(historyRows);
  const hoursWatched = Math.round((progressSeconds / 3600) * 10) / 10;
  const estimatedRevenue = Math.round(hoursWatched * REVENUE_PER_HOUR_BRL * 100) / 100;
  const averageRetention = averageRetentionPercent(historyRows);
  const completionRate = averageCompletionRate(historyRows);
  const favoritedCount = watchlistRows.length;
  const watchlistByVideo = countWatchlistByVideoId(lifetimeWatchlistRows);

  const currentPeriodViews = currentViewsRows.length;
  const previousPeriodViews = previousViewsRows.length;
  const viewsTrend = groupViewsByDay(currentViewsRows, Math.min(periodDays, 14));

  const enrichedVideos = videos.map((video) => ({
    ...video,
    watchlistCount: watchlistByVideo.get(video.id) || 0,
  }));

  return {
    metrics: {
      totalViews,
      viewsChangePercent: percentChange(currentPeriodViews, previousPeriodViews),
      hoursWatched,
      estimatedRevenue,
      averageRetention,
      favoritedCount,
      completionRate,
      viewsTrend,
    },
    videos: enrichedVideos,
    isAdminView: isDashboardPrivileged(profile),
  };
}

/** @deprecated Use fetchPartnerDashboardData */
export async function fetchPartnerDashboardMetrics(supabase, userId, periodDays = 30, profile = null) {
  const result = await fetchPartnerDashboardData(
    supabase,
    userId,
    profile || { role: 'partner' },
    periodDays,
  );
  return result.metrics;
}

/** @deprecated Use fetchPartnerDashboardData */
export async function fetchPartnerVideos(supabase, userId, profile = null) {
  const result = await fetchPartnerDashboardData(
    supabase,
    userId,
    profile || { role: 'partner' },
    30,
  );
  return result.videos;
}
