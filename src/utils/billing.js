import { supabase } from '../supabase';
import { PROFILE_FIELDS_SELECT } from './profileMedia';

export function isStripeCheckoutEnabled() {
  return import.meta.env.VITE_STRIPE_CHECKOUT_ENABLED === 'true';
}

/**
 * Inicia checkout Stripe via Edge Function.
 * @returns {{ mode: 'redirect', url: string } | { mode: 'demo' }}
 */
export async function startSubscriptionCheckout(planId) {
  if (!isStripeCheckoutEnabled()) {
    return { mode: 'demo' };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session?.access_token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { planId },
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
  });

  if (error) {
    console.error('Erro ao invocar create-checkout-session:', error);
    throw new Error(error.message || 'Não foi possível iniciar o checkout.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.url) {
    throw new Error('Resposta de checkout inválida.');
  }

  return { mode: 'redirect', url: data.url };
}

/** Fallback local quando Stripe não está configurado (dev/demo). */
export async function confirmDemoSubscription(userId, planId) {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      subscription_plan: planId,
      subscription_status: 'active',
      payment_method_brand: 'Visa',
      payment_method_last4: '4242',
    })
    .eq('id', userId)
    .select(PROFILE_FIELDS_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

const MIN_SUPPORT_CENTS = 500;
const MAX_SUPPORT_CENTS = 50000;

/**
 * Inicia checkout Stripe de apoio a parceiro.
 * @returns {{ mode: 'redirect', url: string } | { mode: 'demo' }}
 */
export async function startPartnerSupportCheckout(partnerId, amountCents, returnPath = '/casos') {
  if (!partnerId) {
    throw new Error('Parceiro inválido.');
  }

  if (!Number.isFinite(amountCents) || amountCents < MIN_SUPPORT_CENTS || amountCents > MAX_SUPPORT_CENTS) {
    throw new Error('Valor de apoio inválido.');
  }

  if (!isStripeCheckoutEnabled()) {
    return { mode: 'demo' };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session?.access_token) {
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const { data, error } = await supabase.functions.invoke('create-partner-support-session', {
    body: { partnerId, amountCents, returnPath },
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
    },
  });

  if (error) {
    console.error('Erro ao invocar create-partner-support-session:', error);
    throw new Error(error.message || 'Não foi possível iniciar o checkout de apoio.');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.url) {
    throw new Error('Resposta de checkout inválida.');
  }

  return { mode: 'redirect', url: data.url };
}

/** Fallback local quando Stripe não está configurado (dev/demo). */
export async function confirmDemoPartnerSupport(userId, partnerId, amountCents) {
  const { data, error } = await supabase
    .from('partner_supports')
    .insert({
      user_id: userId,
      partner_id: partnerId,
      amount: amountCents,
      status: 'completed',
    })
    .select('id, user_id, partner_id, amount, status, created_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
