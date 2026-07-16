/**
 * Estatísticas agregadas de engajamento do parceiro a partir do banco.
 */
export async function fetchPartnerLifetimeStats(supabase, creatorId) {
  if (!creatorId) {
    return { totalViews: 0, totalLikes: 0, totalComments: 0 };
  }

  try {
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('id, views, gostei, gostei_muito')
      .eq('creator_id', creatorId);

    if (videosError || !videos?.length) {
      return { totalViews: 0, totalLikes: 0, totalComments: 0 };
    }

    const totalViews = videos.reduce(
      (sum, video) => sum + (Number(video.views) || 0),
      0
    );

    const totalLikes = videos.reduce(
      (sum, video) =>
        sum + (Number(video.gostei) || 0) + (Number(video.gostei_muito) || 0),
      0
    );

    const videoIds = videos.map((video) => String(video.id));

    const { count, error: commentsError } = await supabase
      .from('case_theories')
      .select('*', { count: 'exact', head: true })
      .in('video_id', videoIds);

    return {
      totalViews,
      totalLikes,
      totalComments: commentsError ? 0 : (count || 0),
    };
  } catch {
    return { totalViews: 0, totalLikes: 0, totalComments: 0 };
  }
}
