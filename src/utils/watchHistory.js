import { supabase } from '../supabase';
import { readVideoProgress, saveVideoProgress } from './videoPlayback';

const VIDEO_SELECT = '*, creator_id (id, username, "creatorAvatar", role)';

function isMissingTableError(error) {
  if (!error) return false;
  const message = error.message || '';
  return (
    error.code === '42P01'
    || error.code === 'PGRST205'
    || message.includes('user_watch_history')
    || message.includes('schema cache')
  );
}

function computeProgressPercent(progressSeconds, durationSeconds) {
  if (!durationSeconds || durationSeconds <= 0) {
    return progressSeconds > 0 ? 8 : 0;
  }
  return Math.min(100, Math.max(0, (progressSeconds / durationSeconds) * 100));
}

function isResumeCandidate(progressSeconds, durationSeconds) {
  if (!progressSeconds || progressSeconds < 5) return false;
  if (durationSeconds > 0 && progressSeconds / durationSeconds >= 0.95) return false;
  return true;
}

function mapVideosById(videos = []) {
  return new Map(videos.map((video) => [video.id, video]));
}

export async function fetchWatchProgress(userId, videoId) {
  const cached = readVideoProgress(userId, videoId);
  if (!userId || !videoId) return cached;

  const { data, error } = await supabase
    .from('user_watch_history')
    .select('progress_seconds, duration_seconds')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();

  if (error) {
    if (!isMissingTableError(error)) {
      console.error('Erro ao buscar progresso:', error);
    }
    return cached;
  }

  const dbProgress = data?.progress_seconds ?? 0;
  const resolved = Math.max(cached, dbProgress);
  if (resolved > 0) {
    saveVideoProgress(userId, videoId, resolved);
  }
  return resolved;
}

export async function persistWatchProgress(userId, videoId, progressSeconds, durationSeconds = 0) {
  if (!videoId || !Number.isFinite(progressSeconds)) return;

  saveVideoProgress(userId, videoId, progressSeconds);

  if (!userId) return;

  const progress = Math.max(0, Math.floor(progressSeconds));
  const duration = Math.max(0, Math.floor(durationSeconds || 0));

  const { error } = await supabase.from('user_watch_history').upsert(
    {
      user_id: userId,
      video_id: videoId,
      progress_seconds: progress,
      duration_seconds: duration,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,video_id' },
  );

  if (error && !isMissingTableError(error)) {
    console.error('Erro ao salvar progresso:', error);
  }
}

export async function fetchContinueWatching(userId, limit = 12) {
  if (!userId) return [];

  const { data: historyRows, error } = await supabase
    .from('user_watch_history')
    .select('video_id, progress_seconds, duration_seconds, updated_at')
    .eq('user_id', userId)
    .gt('progress_seconds', 0)
    .order('updated_at', { ascending: false })
    .limit(limit * 4);

  if (error) {
    if (!isMissingTableError(error)) {
      console.error('Erro ao buscar continuar assistindo:', error);
    }
    return [];
  }

  const candidates = (historyRows || []).filter((row) =>
    row.video_id && isResumeCandidate(row.progress_seconds, row.duration_seconds),
  );

  if (!candidates.length) return [];

  const videoIds = [...new Set(candidates.map((row) => row.video_id))];

  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select(VIDEO_SELECT)
    .in('id', videoIds)
    .eq('is_short', false)
    .is('parent_video_id', null);

  if (videosError) {
    console.error('Erro ao buscar vídeos do histórico:', videosError);
    return [];
  }

  const videosById = mapVideosById(videos);

  return candidates
    .map((row) => {
      const video = videosById.get(row.video_id);
      if (!video) return null;

      return {
        ...video,
        watchProgressPercent: computeProgressPercent(row.progress_seconds, row.duration_seconds),
        watchProgressSeconds: row.progress_seconds,
        watchDurationSeconds: row.duration_seconds,
      };
    })
    .filter(Boolean)
    .slice(0, limit);
}
