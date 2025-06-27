// src/supabase.js
import { createClient } from '@supabase/supabase-js';

// Garante que as variáveis de ambiente estão presentes
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e/ou Anon Key não estão definidos no .env');
}

// Cria o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Carrega todos os vídeos.
 * Retorna um array vazio em caso de erro.
 */
export async function loadAllVideos() {
  const { data, error } = await supabase
    .from('videos')
    .select('*') // Seleciona todas as colunas
    .order('id', { ascending: true });

  if (error) {
    console.error('Erro ao carregar vídeos:', error);
    return []; // retorna array vazio, não { data, error }
  }

  return data;
}

/**
 * Carrega todos os criadores.
 * Retorna um array vazio em caso de erro.
 */
export async function loadAllCreators() {
  const { data, error } = await supabase
    .from('creators')
    .select('*') // Seleciona todas as colunas
    .order('name', { ascending: true });

  if (error) {
    console.error('Erro ao carregar criadores:', error);
    return []; // retorna array vazio
  }

  return data;
}
