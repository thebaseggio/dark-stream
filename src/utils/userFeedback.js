import { supabase } from '../supabase';

export const FEEDBACK_LIKE = 'like';
export const FEEDBACK_DISLIKE = 'dislike';

const LOCAL_FEEDBACK_KEY = 'darkstream:user-feedback';

function readLocalFeedback() {
  try {
    const raw = localStorage.getItem(LOCAL_FEEDBACK_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalFeedback(map) {
  localStorage.setItem(LOCAL_FEEDBACK_KEY, JSON.stringify(map));
}

export function saveLocalFeedback(videoId, rating) {
  const map = readLocalFeedback();
  map[videoId] = rating;
  writeLocalFeedback(map);
}

export function clearLocalFeedback(videoId) {
  const map = readLocalFeedback();
  delete map[videoId];
  writeLocalFeedback(map);
}

export function reactionToFeedbackType(reaction) {
  if (reaction === FEEDBACK_LIKE) return 'gostei';
  if (reaction === FEEDBACK_DISLIKE) return 'nao_gostei';
  return null;
}

export function applyVideoFeedbackCounters(video, previousFeedbackType, nextFeedbackType) {
  if (!video) return video;

  const updates = { ...video };

  if (previousFeedbackType === 'gostei') {
    updates.gostei = Math.max(0, (video.gostei || 0) - 1);
  } else if (previousFeedbackType === 'nao_gostei') {
    updates.nao_gostei = Math.max(0, (video.nao_gostei || 0) - 1);
  }

  if (nextFeedbackType === 'gostei') {
    updates.gostei = (updates.gostei ?? video.gostei ?? 0) + 1;
  } else if (nextFeedbackType === 'nao_gostei') {
    updates.nao_gostei = (updates.nao_gostei ?? video.nao_gostei ?? 0) + 1;
  }

  return updates;
}

function isMissingRpcError(error) {
  if (!error) return false;

  const message = error.message || '';
  return (
    error.code === 'PGRST202'
    || error.code === '42883'
    || error.code === '404'
    || message.includes('apply_video_feedback_change')
    || message.includes('increment_video_feedback')
    || message.includes('Could not find the function')
    || message.includes('404')
  );
}

async function syncVideoFeedbackCounters(videoId, previousFeedbackType, nextFeedbackType) {
  const { error: rpcError } = await supabase.rpc('apply_video_feedback_change', {
    video_row_id: videoId,
    previous_type: previousFeedbackType,
    next_type: nextFeedbackType,
  });

  if (!rpcError) {
    return { ok: true };
  }

  if (!isMissingRpcError(rpcError)) {
    return { ok: false, error: rpcError };
  }

  if (!previousFeedbackType && nextFeedbackType) {
    const { error: incrementError } = await supabase.rpc('increment_video_feedback', {
      video_row_id: videoId,
      feedback_type: nextFeedbackType,
    });

    if (!incrementError) {
      return { ok: true, fallback: 'increment' };
    }

    if (!isMissingRpcError(incrementError)) {
      return { ok: false, error: incrementError };
    }
  }

  return { ok: true, skippedCounters: true };
}

export async function persistVideoReaction({
  userId,
  videoId,
  previousReaction,
  nextReaction,
}) {
  const previousFeedbackType = reactionToFeedbackType(previousReaction);
  const nextFeedbackType = reactionToFeedbackType(nextReaction);

  try {
    const counterResult = await syncVideoFeedbackCounters(
      videoId,
      previousFeedbackType,
      nextFeedbackType,
    );

    if (!counterResult.ok) {
      return { ok: false, error: counterResult.error };
    }

    if (userId) {
      if (nextReaction) {
        const { error } = await saveUserFeedback(userId, videoId, nextReaction);
        if (error) return { ok: false, error };
      } else {
        const { error } = await removeUserFeedback(userId, videoId);
        if (error) return { ok: false, error };
      }
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function saveUserFeedback(userId, videoId, rating) {
  if (!userId || !videoId) return { error: new Error('Usuário ou vídeo inválido') };

  const { error } = await supabase
    .from('user_feedback')
    .upsert(
      {
        user_id: userId,
        video_id: videoId,
        rating,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,video_id' }
    );

  return { error };
}

export async function removeUserFeedback(userId, videoId) {
  if (!userId || !videoId) return { error: new Error('Usuário ou vídeo inválido') };

  const { error } = await supabase
    .from('user_feedback')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId);

  return { error };
}

export async function fetchUserFeedback(userId) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_feedback')
    .select('video_id, rating')
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao buscar feedback do usuário:', error);
    return [];
  }

  return data || [];
}

export function getCreatorId(video) {
  if (!video) return null;
  return video.creator_id?.id || video.creator_id || null;
}

export function normalizeFeedbackEntries(remoteEntries = [], videosById = new Map()) {
  const entries = [...remoteEntries];

  const localMap = readLocalFeedback();
  Object.entries(localMap).forEach(([videoId, rating]) => {
    if (!entries.some((entry) => entry.video_id === videoId)) {
      entries.push({ video_id: videoId, rating });
    }
  });

  return entries.map((entry) => {
    const video = videosById.get(entry.video_id);
    return {
      videoId: entry.video_id,
      rating: entry.rating,
      creatorId: getCreatorId(video),
      tags: Array.isArray(video?.tags) ? video.tags : [],
      categories: Array.isArray(video?.category)
        ? video.category
        : video?.category
          ? [video.category]
          : [],
    };
  });
}

export function filterVideosByFeedback(videos, feedbackEntries) {
  if (!feedbackEntries.length) return videos;

  const dislikedVideoIds = new Set();
  const dislikedCreatorIds = new Set();

  feedbackEntries.forEach((entry) => {
    if (entry.rating === FEEDBACK_DISLIKE) {
      dislikedVideoIds.add(entry.videoId);
      if (entry.creatorId) dislikedCreatorIds.add(String(entry.creatorId));
    }
  });

  return videos.filter((video) => {
    if (dislikedVideoIds.has(video.id)) return false;
    const creatorId = getCreatorId(video);
    if (creatorId && dislikedCreatorIds.has(String(creatorId))) return false;
    return true;
  });
}

export function buildRecommendedVideos(videos, feedbackEntries, limit = 12) {
  const likedEntries = feedbackEntries.filter((entry) => entry.rating === FEEDBACK_LIKE);
  if (!likedEntries.length) return [];

  const dislikedVideoIds = new Set(
    feedbackEntries.filter((e) => e.rating === FEEDBACK_DISLIKE).map((e) => e.videoId)
  );
  const dislikedCreatorIds = new Set(
    feedbackEntries
      .filter((e) => e.rating === FEEDBACK_DISLIKE && e.creatorId)
      .map((e) => String(e.creatorId))
  );
  const likedVideoIds = new Set(likedEntries.map((entry) => entry.videoId));

  const likedCreators = new Set(
    likedEntries.filter((e) => e.creatorId).map((e) => String(e.creatorId))
  );
  const likedTags = new Set(likedEntries.flatMap((e) => e.tags.map((t) => t.toLowerCase())));
  const likedCategories = new Set(
    likedEntries.flatMap((e) => e.categories.map((c) => c.toLowerCase()))
  );

  const scored = videos
    .filter((video) => {
      if (likedVideoIds.has(video.id)) return false;
      if (dislikedVideoIds.has(video.id)) return false;
      const creatorId = getCreatorId(video);
      if (creatorId && dislikedCreatorIds.has(String(creatorId))) return false;
      return true;
    })
    .map((video) => {
      let score = 0;
      const creatorId = getCreatorId(video);
      if (creatorId && likedCreators.has(String(creatorId))) score += 5;

      const tags = Array.isArray(video.tags) ? video.tags : [];
      tags.forEach((tag) => {
        if (likedTags.has(tag.toLowerCase())) score += 2;
      });

      const categories = Array.isArray(video.category)
        ? video.category
        : video.category
          ? [video.category]
          : [];
      categories.forEach((cat) => {
        if (likedCategories.has(cat.toLowerCase())) score += 1;
      });

      return { video, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.video);
}
