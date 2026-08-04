import { supabase } from '../supabase';

const VIDEO_SELECT = '*, creator_id (id, username, "creatorAvatar", role)';

function isMissingTableError(error) {
  if (!error) return false;
  const message = error.message || '';
  return (
    error.code === '42P01'
    || error.code === 'PGRST205'
    || message.includes('user_watchlist')
    || message.includes('schema cache')
  );
}

export async function fetchWatchlist(userId, limit = 24) {
  return fetchWatchlistVideos(userId, limit);
}

export async function fetchWatchlistVideos(userId, limit = 24) {
  if (!userId) return [];

  const { data: watchlistRows, error } = await supabase
    .from('user_watchlist')
    .select('video_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (!isMissingTableError(error)) {
      console.error('Erro ao buscar minha lista:', error);
    }
    return [];
  }

  const rows = (watchlistRows || []).filter((row) => row.video_id);
  if (!rows.length) return [];

  const videoIds = rows.map((row) => row.video_id);

  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select(VIDEO_SELECT)
    .in('id', videoIds)
    .eq('is_short', false)
    .is('parent_video_id', null);

  if (videosError) {
    console.error('Erro ao buscar vídeos da lista:', videosError);
    return [];
  }

  const videosById = new Map((videos || []).map((video) => [video.id, video]));

  return rows
    .map((row) => videosById.get(row.video_id))
    .filter(Boolean);
}

export async function checkWatchlistStatus(userId, videoId) {
  if (!userId || !videoId) return false;

  const { data, error } = await supabase
    .from('user_watchlist')
    .select('id')
    .eq('user_id', userId)
    .eq('video_id', videoId)
    .maybeSingle();

  if (error) {
    if (!isMissingTableError(error)) {
      console.error('Erro ao verificar lista:', error);
    }
    return false;
  }

  return Boolean(data);
}

export async function addToWatchlist(userId, videoId) {
  if (!userId || !videoId) return { error: new Error('Usuário ou vídeo inválido.') };

  const { error } = await supabase.from('user_watchlist').insert({
    user_id: userId,
    video_id: videoId,
  });

  if (error && error.code !== '23505' && !isMissingTableError(error)) {
    console.error('Erro ao adicionar à lista:', error);
    return { error };
  }

  return { error: null };
}

export async function removeFromWatchlist(userId, videoId) {
  if (!userId || !videoId) return { error: new Error('Usuário ou vídeo inválido.') };

  const { error } = await supabase
    .from('user_watchlist')
    .delete()
    .eq('user_id', userId)
    .eq('video_id', videoId);

  if (error && !isMissingTableError(error)) {
    console.error('Erro ao remover da lista:', error);
    return { error };
  }

  return { error: null };
}

export async function toggleWatchlist(userId, videoId, currentlyInList) {
  if (currentlyInList) {
    return removeFromWatchlist(userId, videoId);
  }
  return addToWatchlist(userId, videoId);
}
