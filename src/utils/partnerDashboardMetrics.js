import { buildPeriodStartIso } from './opsInsights';

/** Repasse estimado por hora assistida (RPM simplificado). */
export const REVENUE_PER_HOUR_BRL = 0.05;

const VIDEO_LIST_SELECT = [
  'id',
  'title',
  'thumbnail',
  'created_at',
  'views',
  'videoUrl',
  'duration',
  'runtime',
  'duration_seconds',
  'is_short',
  'short_type',
  'category',
  'creator_id',
].join(', ');

export function canAccessPartnerDashboard(profile) {
  return ['partner', 'admin', 'tester'].includes(profile?.role);
}

export function isDashboardPrivileged(profile) {
  return profile?.role === 'admin' || profile?.role === 'tester';
}

export function getVideoPublishStatus(video) {
  if (video?.videoUrl) return 'published';
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

async function fetchPartnerVideoRows(supabase, userId, profile) {
  let query = supabase
    .from('videos')
    .select(VIDEO_LIST_SELECT)
    .or('is_short.eq.false,is_short.is.null')
    .is('parent_video_id', null)
    .order('created_at', { ascending: false });

  if (!isDashboardPrivileged(profile)) {
    query = query.eq('creator_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar vídeos do parceiro:', error);
    return [];
  }

  const videos = data || [];

  if (!videos.length && !isDashboardPrivileged(profile) && userId) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('videos')
      .select(VIDEO_LIST_SELECT)
      .eq('creator_id', userId)
      .order('created_at', { ascending: false });

    if (fallbackError) {
      console.error('Erro no fallback de vídeos do parceiro:', fallbackError);
      return [];
    }

    return fallbackData || [];
  }

  return videos;
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
