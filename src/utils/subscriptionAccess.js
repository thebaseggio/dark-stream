import { supabase } from '../supabase';
import { PROFILE_FIELDS_SELECT } from './profileMedia';

export function hasActiveSubscription(profile) {
  return profile?.subscription_status === 'active';
}

export function isDevSubscriptionToolsEnabled() {
  return import.meta.env.DEV;
}

/**
 * Ativa assinatura no perfil do usuário logado — apenas em desenvolvimento local.
 */
export async function forceActivateDevSubscription(userId, planId = 'investigador') {
  if (!isDevSubscriptionToolsEnabled()) {
    throw new Error('forceActivateDevSubscription só está disponível em ambiente de desenvolvimento.');
  }

  if (!userId) {
    throw new Error('Usuário não autenticado.');
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      subscription_plan: planId,
      subscription_status: 'active',
    })
    .eq('id', userId)
    .select(PROFILE_FIELDS_SELECT)
    .single();

  if (error) {
    console.error('Erro ao ativar assinatura de dev:', error);
    throw error;
  }

  console.info('[dev] Assinatura ativada para', userId, data);
  return data;
}
