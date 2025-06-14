// supabase.js
import { createClient } from '@supabase/supabase-js';

// Garante que as variáveis de ambiente estão presentes
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e/ou Anon Key não estão definidos no .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Carrega um vídeo específico pelo ID.
 */
export async function loadVideo(id) {
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, description, videoUrl, thumbnail, duration, publishedAt, category, views, creatorName, creatorAvatar')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao carregar vídeo:', error);
    throw error;
  }

  return data;
}

/**
 * Carrega todos os vídeos.
 */
export async function loadAllVideos() {
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, description, videoUrl, thumbnail, duration, publishedAt, category, views, creatorName, creatorAvatar')
    .order('id', { ascending: true });

  if (error) {
    console.error('Erro ao carregar vídeos:', error);
    throw error;
  }

  return data;
}
