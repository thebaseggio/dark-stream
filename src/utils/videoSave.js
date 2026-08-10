export function isMissingCommunitySuggestionColumnError(error) {
  if (!error) return false;

  const message = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();

  return (
    error.code === '42703'
    || error.code === 'PGRST204'
    || message.includes('is_community_suggestion')
    || (message.includes('schema cache') && message.includes('column'))
  );
}

export function withoutCommunitySuggestionField(payload) {
  if (!payload || typeof payload !== 'object') return payload;

  const { is_community_suggestion, ...rest } = payload;
  return rest;
}

export async function insertVideoRow(supabase, videoRow) {
  let result = await supabase
    .from('videos')
    .insert([videoRow])
    .select('id')
    .single();

  if (
    result.error
    && isMissingCommunitySuggestionColumnError(result.error)
    && Object.prototype.hasOwnProperty.call(videoRow, 'is_community_suggestion')
  ) {
    console.warn('[videos] Coluna is_community_suggestion indisponível — insert sem a flag.');
    result = await supabase
      .from('videos')
      .insert([withoutCommunitySuggestionField(videoRow)])
      .select('id')
      .single();
  }

  return result;
}

export async function updateVideoRow(supabase, videoRow, videoId, creatorId) {
  let result = await supabase
    .from('videos')
    .update(videoRow)
    .eq('id', videoId)
    .eq('creator_id', creatorId);

  if (
    result.error
    && isMissingCommunitySuggestionColumnError(result.error)
    && Object.prototype.hasOwnProperty.call(videoRow, 'is_community_suggestion')
  ) {
    console.warn('[videos] Coluna is_community_suggestion indisponível — update sem a flag.');
    result = await supabase
      .from('videos')
      .update(withoutCommunitySuggestionField(videoRow))
      .eq('id', videoId)
      .eq('creator_id', creatorId);
  }

  return result;
}
