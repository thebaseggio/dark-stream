import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';
import Stripe from 'npm:stripe@17.7.0';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

async function updateProfileSubscription(
  userId: string,
  payload: {
    planId?: string | null;
    status?: string | null;
    periodEnd?: number | null;
    paymentBrand?: string | null;
    paymentLast4?: string | null;
    customerId?: string | null;
  },
) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service role não configurado.');
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const update: Record<string, unknown> = {};

  if (payload.planId !== undefined) update.subscription_plan = payload.planId;
  if (payload.status !== undefined) update.subscription_status = payload.status;
  if (payload.customerId) update.stripe_customer_id = payload.customerId;
  if (payload.paymentBrand !== undefined) update.payment_method_brand = payload.paymentBrand;
  if (payload.paymentLast4 !== undefined) update.payment_method_last4 = payload.paymentLast4;
  if (payload.periodEnd) {
    update.subscription_period_end = new Date(payload.periodEnd * 1000).toISOString();
  }

  if (Object.keys(update).length === 0) return;

  const { error } = await admin.from('profiles').update(update).eq('id', userId);

  if (error) {
    console.error('Erro ao atualizar profile:', error);
    throw error;
  }
}

function mapStripeStatus(status: string | null | undefined) {
  if (!status) return 'inactive';
  if (status === 'active' || status === 'trialing') return 'active';
  if (status === 'past_due' || status === 'unpaid') return 'past_due';
  if (status === 'canceled' || status === 'incomplete_expired') return 'canceled';
  return status;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe webhook secrets ausentes.');
    return new Response('Webhook not configured', { status: 503 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return new Response('Invalid signature', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id
          ?? session.metadata?.supabase_user_id
          ?? null;
        const planId = session.metadata?.plan_id ?? null;

        if (!userId) break;

        let paymentBrand: string | null = null;
        let paymentLast4: string | null = null;

        if (session.payment_intent && typeof session.payment_intent === 'string') {
          const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent, {
            expand: ['payment_method'],
          });
          const pm = paymentIntent.payment_method;
          if (pm && typeof pm === 'object' && pm.type === 'card' && pm.card) {
            paymentBrand = pm.card.brand ?? null;
            paymentLast4 = pm.card.last4 ?? null;
          }
        }

        await updateProfileSubscription(userId, {
          planId,
          status: 'active',
          customerId: typeof session.customer === 'string' ? session.customer : null,
          paymentBrand,
          paymentLast4,
        });
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id ?? null;
        const planId = subscription.metadata?.plan_id ?? null;

        if (!userId) break;

        await updateProfileSubscription(userId, {
          planId: event.type === 'customer.subscription.deleted' ? null : planId,
          status: mapStripeStatus(subscription.status),
          periodEnd: subscription.current_period_end ?? null,
          customerId: typeof subscription.customer === 'string' ? subscription.customer : null,
        });
        break;
      }

      default:
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Erro ao processar webhook Stripe:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
});
