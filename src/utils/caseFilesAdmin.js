const CASE_FILE_TYPES = ['document', 'image', 'link'];

export function createEmptyCaseFileRow() {
  return {
    id: null,
    title: '',
    file_url: '',
    type: 'document',
  };
}

export function normalizeCaseFilesInput(rows = []) {
  return rows
    .filter((row) => row.title?.trim() || row.file_url?.trim())
    .map((row) => ({
      id: row.id || null,
      title: row.title.trim(),
      file_url: row.file_url.trim(),
      type: CASE_FILE_TYPES.includes(row.type) ? row.type : 'document',
    }));
}

export function validateCaseFilesInput(rows = []) {
  const payload = normalizeCaseFilesInput(rows);

  payload.forEach((row, index) => {
    if (!row.title) {
      throw new Error(`Evidência ${index + 1}: informe o título.`);
    }
    if (!row.file_url) {
      throw new Error(`Evidência ${index + 1}: informe a URL do arquivo.`);
    }
  });

  return payload;
}

export async function fetchCaseFilesForVideo(supabase, videoId) {
  if (!videoId) return [];

  const { data, error } = await supabase
    .from('case_files')
    .select('id, title, file_url, type')
    .eq('video_id', videoId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function syncCaseFilesForVideo(supabase, videoId, rows = []) {
  if (!videoId) return;

  const payload = normalizeCaseFilesInput(rows);
  const { data: existingRows, error: fetchError } = await supabase
    .from('case_files')
    .select('id')
    .eq('video_id', videoId);

  if (fetchError) throw fetchError;

  const existingIds = new Set((existingRows || []).map((row) => row.id));
  const keptIds = new Set(payload.filter((row) => row.id).map((row) => row.id));
  const idsToDelete = [...existingIds].filter((id) => !keptIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('case_files')
      .delete()
      .in('id', idsToDelete);

    if (deleteError) throw deleteError;
  }

  const inserts = payload.filter((row) => !row.id);
  if (inserts.length > 0) {
    const { error: insertError } = await supabase.from('case_files').insert(
      inserts.map((row) => ({
        video_id: videoId,
        title: row.title,
        file_url: row.file_url,
        type: row.type,
      }))
    );

    if (insertError) throw insertError;
  }

  const updates = payload.filter((row) => row.id);
  for (const row of updates) {
    const { error: updateError } = await supabase
      .from('case_files')
      .update({
        title: row.title,
        file_url: row.file_url,
        type: row.type,
      })
      .eq('id', row.id)
      .eq('video_id', videoId);

    if (updateError) throw updateError;
  }
}

export { CASE_FILE_TYPES };
