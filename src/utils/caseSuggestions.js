import { supabase } from '../supabase';
import {
  sanitizeSuggestionDescription,
  sanitizeSuggestionTitle,
  sanitizeUsername,
} from './sanitizeText';

export const SUGGESTION_CATEGORIES = ['Nacional', 'Internacional', 'Sobrenatural'];

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getThirtyDaysAgoIso() {
  return new Date(Date.now() - THIRTY_DAYS_MS).toISOString();
}

function mapSuggestionCategoryToVideoCategory(category) {
  const map = {
    Nacional: 'Nacionais',
    Internacional: 'Internacionais',
    Sobrenatural: 'Sobrenaturais',
  };
  return map[category] || category;
}

export function buildSuggestionCreditLine(suggestion) {
  if (!suggestion) return '';
  return `Sugestão da comunidade por ${suggestion.user_name}.`;
}

export function buildVideoPrefillFromSuggestion(suggestion) {
  if (!suggestion) return null;

  return {
    title: suggestion.title,
    category: mapSuggestionCategoryToVideoCategory(suggestion.category),
    is_community_suggestion: true,
  };
}

export async function fetchCaseSuggestions(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('case_suggestions')
    .select('id, user_id, user_name, title, description, category, upvotes_count, created_at')
    .gte('created_at', since);

  if (error) {
    console.error('Erro ao buscar sugestões:', error);
    return [];
  }

  return (data || []).sort((a, b) => {
    const votesDiff = (b.upvotes_count || 0) - (a.upvotes_count || 0);
    if (votesDiff !== 0) return votesDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

export async function fetchUserSuggestionVotes(userId) {
  if (!userId) return new Set();

  const { data, error } = await supabase
    .from('case_suggestion_votes')
    .select('suggestion_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao buscar votos do usuário:', error);
    return new Set();
  }

  return new Set((data || []).map((row) => row.suggestion_id));
}

export async function createCaseSuggestion(userId, userName, payload) {
  if (!userId) return { data: null, error: new Error('Usuário não autenticado.') };

  const title = sanitizeSuggestionTitle(payload.title);
  const description = sanitizeSuggestionDescription(payload.description);
  const safeUserName = sanitizeUsername(userName);

  if (!title) {
    return { data: null, error: new Error('Título inválido.') };
  }

  const { data, error } = await supabase
    .from('case_suggestions')
    .insert({
      user_id: userId,
      user_name: safeUserName || 'Assinante',
      title,
      description,
      category: payload.category,
    })
    .select('id, user_id, user_name, title, description, category, upvotes_count, created_at')
    .single();

  if (error) {
    console.error('Erro ao criar sugestão:', error);
  }

  return { data, error };
}

export async function voteCaseSuggestion(userId, suggestionId) {
  if (!userId || !suggestionId) {
    return { error: new Error('Dados inválidos para voto.') };
  }

  const { error } = await supabase
    .from('case_suggestion_votes')
    .insert({
      user_id: userId,
      suggestion_id: suggestionId,
    });

  if (error) {
    if (error.code === '23505') {
      return { error: new Error('Você já votou nesta sugestão.') };
    }
    console.error('Erro ao votar sugestão:', error);
  }

  return { error };
}

export { getThirtyDaysAgoIso };
