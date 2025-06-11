// supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://baqvszumalgtgaepxwqq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'SUA_CHAVE_AQUI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Carrega um vídeo específico pelo ID, usando nomes de coluna conforme estão no banco (camelCase).
 * @param {number|string} id - ID do vídeo a ser carregado
 * @returns {Promise<Object>} Dados do vídeo
 */
export async function loadVideo(id) {
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, description, videoUrl, thumbnail, duration, publishedAt, category, views')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao carregar vídeo:', error);
    throw error;
  }

  return data;
}

/**
 * Carrega todos os vídeos ordenados por ID.
 * @returns {Promise<Object[]>} Lista de vídeos
 */
export async function loadAllVideos() {
  const { data, error } = await supabase
    .from('videos')
    .select('id, title, description, videoUrl, thumbnail, duration, publishedAt, category, views')
    .order('id', { ascending: true });

  if (error) {
    console.error('Erro ao carregar vídeos:', error);
    throw error;
  }

  return data;
}
