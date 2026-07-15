import { countUniqueCases } from './investigatorRank';

export function estimateInvestigationHours(viewCount) {
  const avgMinutesPerInquiry = 15;
  return Math.round((viewCount * avgMinutesPerInquiry) / 60);
}

export function buildRetentionData(videos, viewsMap, theoriesMap, supportsMap, limit = 5) {
  return videos
    .map((video) => {
      const started = viewsMap.get(video.id) || 0;
      const completed = (theoriesMap.get(video.id) || 0) + (supportsMap.get(video.id) || 0);
      const completionRate = started > 0 ? Math.min(100, Math.round((completed / started) * 100)) : 0;
      return {
        id: video.id,
        title: video.title,
        started,
        completed,
        completionRate,
      };
    })
    .filter((item) => item.started > 0)
    .sort((a, b) => b.started - a.started)
    .slice(0, limit);
}

export function buildFieldStatus(videos, viewsMap, theoriesMap, supportsMap, limit = 8) {
  const scored = videos.map((video) => {
    const inquiries = viewsMap.get(video.id) || 0;
    const theories = theoriesMap.get(video.id) || 0;
    const supports = supportsMap.get(video.id) || 0;
    const score = inquiries * 2 + theories * 3 + supports * 2;
    return {
      id: video.id,
      title: video.title,
      inquiries,
      theories,
      supports,
      score,
    };
  });

  const sorted = scored.sort((a, b) => b.score - a.score).slice(0, limit);
  const median = sorted[Math.floor(sorted.length / 2)]?.score || 0;

  return sorted.map((item) => ({
    ...item,
    status: item.score >= median && item.score > 0 ? 'hot' : 'cold',
  }));
}

export async function fetchAudiencePatentDistribution(supabase, viewerIds) {
  const buckets = { recruta: 0, agente: 0, elite: 0 };
  if (!viewerIds.length) return buckets;

  const uniqueIds = [...new Set(viewerIds)];

  const results = await Promise.all(
    uniqueIds.map(async (userId) => {
      const [viewsRes, likesRes] = await Promise.all([
        supabase.from('views').select('video_id').eq('user_id', userId),
        supabase
          .from('user_feedback')
          .select('video_id')
          .eq('user_id', userId)
          .eq('rating', 'like'),
      ]);

      const ids = [
        ...(viewsRes.data || []).map((v) => v.video_id),
        ...(likesRes.data || []).map((l) => l.video_id),
      ];

      return countUniqueCases(ids);
    })
  );

  results.forEach((caseCount) => {
    if (caseCount <= 2) buckets.recruta += 1;
    else if (caseCount <= 5) buckets.agente += 1;
    else buckets.elite += 1;
  });

  return buckets;
}

export function countByVideoId(rows, idField = 'video_id') {
  const map = new Map();
  rows?.forEach((row) => {
    const key = row[idField];
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return map;
}

/**
 * Gera ISO 8601 válido para filtros gte do PostgREST (tabelas com timestamptz).
 */
export function buildPeriodStartIso(daysParam) {
  if (!daysParam || daysParam <= 0) return null;

  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Number(daysParam));
  date.setUTCHours(0, 0, 0, 0);

  const iso = date.toISOString();
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(iso) ? iso : null;
}

/**
 * Conta espectadores únicos a partir das visualizações (sem consultar subscriptions).
 */
export function countUniqueAudienceFromViews(viewsRows = []) {
  const uniqueViewerIds = new Set(
    viewsRows.map((row) => row.user_id).filter(Boolean)
  );
  return uniqueViewerIds.size;
}

/**
 * @deprecated Não consulta mais o banco — use countUniqueAudienceFromViews.
 * Mantido para compatibilidade; retorna contagem client-side quando viewsRows é passado.
 */
export function fetchSubscriberCountFromViews(viewsRows = []) {
  return countUniqueAudienceFromViews(viewsRows);
}

/**
 * Vídeo em destaque calculado client-side (sem depender de RPC no banco).
 */
export async function fetchTopPerformingVideo(_supabase, _creatorId, _daysParam, videos = [], viewsMap = new Map()) {
  return buildTopVideoFallback(videos, viewsMap);
}

function buildTopVideoFallback(videos, viewsMap) {
  if (!videos?.length) return null;

  let bestVideo = null;
  let bestViews = 0;

  videos.forEach((video) => {
    const viewCount = viewsMap.get(video.id) || viewsMap.get(String(video.id)) || 0;
    if (viewCount > bestViews) {
      bestViews = viewCount;
      bestVideo = {
        ...video,
        recent_views_count: viewCount,
      };
    }
  });

  return bestVideo;
}

/**
 * Evita requisições .in([]) que retornam 400 no PostgREST.
 */
export function emptyQueryResult() {
  return { data: [], error: null, count: 0 };
}

