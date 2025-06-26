// src/supabase.js
import { createClient } from '@supabase/supabase-js';

// Garante que as variáveis de ambiente estão presentes
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e/ou Anon Key não estão definidos no .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Carrega todos os vídeos.
 */
export async function loadAllVideos() {
  const { data, error } = await supabase
    .from('videos')
    .select('*') // Seleciona todas as colunas
    .order('id', { ascending: true });

  if (error) {
    console.error('Erro ao carregar vídeos:', error);
  }

  return { data, error };
}

/**
 * Carrega todos os criadores.
 * (Assumindo que você tem uma tabela 'creators' com colunas 'id', 'name', 'avatar_url', 'bio')
 */
export async function loadAllCreators() {
  const { data, error } = await supabase
    .from('creators')
    .select('*') // Seleciona todas as colunas
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao carregar criadores:', error);
  }

  return { data, error };
}
