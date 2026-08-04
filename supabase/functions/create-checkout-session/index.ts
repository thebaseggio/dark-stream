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

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  monthly: Deno.env.get('STRIPE_PRICE_MONTHLY') ?? undefined,
  annual: Deno.env.get('STRIPE_PRICE_ANNUAL') ?? undefined,
  quarterly: Deno.env.get('STRIPE_PRICE_QUARTERLY') ?? undefined,
};

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
    console.error('Stripe ou Supabase não configurados na Edge Function.');
    return jsonResponse({ error: 'Checkout indisponível no momento.' }, 503);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Não autenticado.' }, 401);
  }

  try {
    const body = await req.json();
    const planId = String(body.planId ?? '').trim();

    if (!planId || !PRICE_BY_PLAN[planId]) {
      return jsonResponse({ error: 'Plano inválido.' }, 400);
    }

    const priceId = PRICE_BY_PLAN[planId];
    if (!priceId) {
      return jsonResponse({ error: `Preço Stripe não configurado para o plano "${planId}".` }, 503);
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, username')
      .eq('id', user.id)
      .maybeSingle();

    const stripe = new Stripe(STRIPE_SECRET_KEY);

    let customerId = profile?.stripe_customer_id ?? null;

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
        name: profile?.username ?? undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const successUrl = `${SITE_URL.replace(/\/$/, '')}/plans?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${SITE_URL.replace(/\/$/, '')}/plans?checkout=canceled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_id: planId,
        },
      },
    });

    if (!session.url) {
      return jsonResponse({ error: 'Não foi possível iniciar o checkout.' }, 500);
    }

    return jsonResponse({ url: session.url, sessionId: session.id }, 200);
  } catch (error) {
    console.error('Erro ao criar checkout session:', error);
    return jsonResponse({ error: 'Falha ao iniciar checkout.' }, 500);
  }
});
