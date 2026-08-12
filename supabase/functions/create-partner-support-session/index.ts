import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import Stripe from 'npm:stripe@17.7.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:5173';

const MIN_AMOUNT_CENTS = 500;
const MAX_AMOUNT_CENTS = 50000;

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonResponse({ error: 'Checkout indisponível no momento.' }, 503);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Não autenticado.' }, 401);
  }

  try {
    const body = await req.json();
    const partnerId = String(body.partnerId ?? '').trim();
    const amountCents = Number(body.amountCents);
    const returnPath = String(body.returnPath ?? '/casos').trim();

    if (!partnerId) {
      return jsonResponse({ error: 'Parceiro inválido.' }, 400);
    }

    if (!Number.isFinite(amountCents) || amountCents < MIN_AMOUNT_CENTS || amountCents > MAX_AMOUNT_CENTS) {
      return jsonResponse({ error: 'Valor de apoio inválido.' }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return jsonResponse({ error: 'Sessão inválida.' }, 401);
    }

    const user = userData.user;

    if (user.id === partnerId) {
      return jsonResponse({ error: 'Você não pode apoiar o próprio canal.' }, 400);
    }

    const { data: partnerProfile } = await supabase
      .from('profiles')
      .select('id, username, role, is_partner')
      .eq('id', partnerId)
      .maybeSingle();

    if (!partnerProfile?.id) {
      return jsonResponse({ error: 'Parceiro não encontrado.' }, 404);
    }

    const { data: supporterProfile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, username')
      .eq('id', user.id)
      .maybeSingle();

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    let customerId = supporterProfile?.stripe_customer_id ?? null;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch {
        customerId = null;
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: supporterProfile?.username ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const safeReturnPath = returnPath.startsWith('/') ? returnPath : '/casos';
    const baseUrl = SITE_URL.replace(/\/$/, '');
    const successUrl = `${baseUrl}${safeReturnPath}?support=success`;
    const cancelUrl = `${baseUrl}${safeReturnPath}?support=canceled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{
        price_data: {
          currency: 'brl',
          unit_amount: amountCents,
          product_data: {
            name: `Apoio a ${partnerProfile.username ?? 'Parceiro'}`,
            description: 'Contribuição ao investigador parceiro no Dark Stream',
          },
        },
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'partner_support',
        supabase_user_id: user.id,
        partner_id: partnerId,
        amount_cents: String(amountCents),
      },
    });

    if (!session.url) {
      return jsonResponse({ error: 'Não foi possível iniciar o checkout.' }, 500);
    }

    return jsonResponse({ url: session.url, sessionId: session.id }, 200);
  } catch (error) {
    console.error('Erro ao criar checkout de apoio:', error);
    return jsonResponse({ error: 'Falha ao iniciar checkout de apoio.' }, 500);
  }
});
