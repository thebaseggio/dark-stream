export function getViewRegisteredKey(userId, videoId) {
  const owner = userId || 'guest';
  return `darkstream:view-registered:${owner}:${videoId}`;
}

export function clearViewRegisteredSession() {
  const prefix = 'darkstream:view-registered:';
  const keysToRemove = [];

  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
}

export function normalizeVideoViews(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeViewCount(value) {
  return normalizeVideoViews(value);
}

/**
 * Incrementa views do vídeo via RPC; fallback com leitura segura do valor atual.
 */
export async function registerVideoView(supabase, { videoId, userId, fallbackViews = 0 }) {
  if (!videoId) return { ok: false, reason: 'missing_video_id' };

  const sessionKey = getViewRegisteredKey(userId, videoId);
  if (sessionStorage.getItem(sessionKey)) {
    return { ok: true, skipped: true };
  }

  try {
    const { error: rpcError } = await supabase.rpc('increment_views', {
      video_row_id: videoId,
      viewer_id: userId || null,
    });

    if (!rpcError) {
      sessionStorage.setItem(sessionKey, '1');
      return { ok: true, method: 'rpc' };
    }
  } catch {
    // segue para fallback
  }

  try {
    const { data: row, error: readError } = await supabase
      .from('videos')
      .select('views')
      .eq('id', videoId)
      .maybeSingle();

    const viewsAtuais = readError
      ? normalizeViewCount(fallbackViews)
      : normalizeViewCount(row?.views ?? fallbackViews);

    const { error: updateError } = await supabase
      .from('videos')
      .update({ views: viewsAtuais + 1 })
      .eq('id', videoId);

    if (!updateError) {
      sessionStorage.setItem(sessionKey, '1');
      return { ok: true, method: 'update', views: viewsAtuais + 1 };
    }
  } catch {
    // falha silenciosa
  }

  return { ok: false };
}
