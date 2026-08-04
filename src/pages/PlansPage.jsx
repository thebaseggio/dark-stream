import React, { Fragment, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import AnimatedPage from '../AnimatedPage';
import SiteContainer from '../components/SiteContainer';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';
import { useAuth } from '../contexts/AuthProvider';
import {
  confirmDemoSubscription,
  isStripeCheckoutEnabled,
  startSubscriptionCheckout,
} from '../utils/billing';

const PLANS = {
  monthly: {
    id: 'monthly',
    name: 'Investigador Mensal',
    price: 'R$ 19,90',
    cadence: '/mês',
    subtitle: 'Flexibilidade total, cancele quando quiser.',
    features: [
      'Acesso HD a todos os casos dos Parceiros',
      '1 tela simultânea',
      'Catálogo completo de investigações',
      'Crachá de investigador no fórum',
    ],
  },
  annual: {
    id: 'annual',
    name: 'Investigador Anual',
    price: 'R$ 179,90',
    cadence: '/ano',
    monthlyEquivalent: '~R$ 14,99/mês',
    subtitle: 'Melhor custo-benefício para investigadores dedicados.',
    popular: true,
    features: [
      'Acesso 4K a todos os casos dos Parceiros',
      '2 telas simultâneas',
      'Acesso antecipado a novos casos',
      'Dossiês exclusivos para download',
      'Selo Anual no perfil de investigador',
    ],
  },
};

const stripeCheckoutEnabled = isStripeCheckoutEnabled();

const CheckIcon = () => (
  <svg className="h-4 w-4 shrink-0 text-emerald-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

function PlanCard({ plan, billingCycle, highlighted, onSubscribe }) {
  const isPopular = plan.popular;

  return (
    <article
      className={`relative flex flex-col border p-6 transition-all md:p-8 ${
        highlighted || isPopular
          ? 'border-brand-primary/50 bg-[linear-gradient(180deg,#140606_0%,#0a0a0a_100%)] shadow-[0_0_40px_rgba(241,196,15,0.08)]'
          : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
      } ${!highlighted && billingCycle === 'annual' && !isPopular ? 'opacity-80' : ''}`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-4 bg-brand-primary px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-black">
          Mais Popular
        </span>
      )}

      <div className="mb-6 space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
          Plano investigador
        </p>
        <h2 className="text-lg font-mono uppercase tracking-wider text-white md:text-xl">
          {plan.name}
        </h2>
        <p className="text-sm text-zinc-400">{plan.subtitle}</p>
      </div>

      <div className="mb-6">
        <p className="font-mono text-3xl text-brand-primary md:text-4xl">
          {plan.price}
          <span className="text-base text-zinc-500">{plan.cadence}</span>
        </p>
        {plan.monthlyEquivalent && (
          <p className="mt-1 text-[11px] font-mono uppercase tracking-wider text-emerald-500/90">
            {plan.monthlyEquivalent}
          </p>
        )}
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm leading-snug text-zinc-300">
            <CheckIcon />
            {feature}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSubscribe(plan)}
        className={`touch-target w-full py-3 text-[11px] font-mono uppercase tracking-widest transition-opacity ${
          highlighted || isPopular
            ? 'bg-brand-primary text-black hover:opacity-90'
            : 'border border-zinc-700 text-zinc-200 hover:border-brand-primary/50 hover:text-brand-primary'
        }`}
      >
        Assinar agora
      </button>
    </article>
  );
}

export default function PlansPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const [billingCycle, setBillingCycle] = useState('annual');
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);

  useEffect(() => {
    const status = searchParams.get('checkout');

    if (status === 'success') {
      refreshProfile().finally(() => {
        navigate('/account?subscribed=1', { replace: true });
      });
      return;
    }

    if (status === 'canceled') {
      setCheckoutError('Checkout cancelado. Você pode tentar novamente quando quiser.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshProfile, navigate]);

  const handleSubscribe = (plan) => {
    if (!user) {
      navigate('/login', { state: { from: '/plans' } });
      return;
    }
    setCheckoutPlan(plan);
    setCheckoutError(null);
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    if (isProcessing) return;
    setIsCheckoutOpen(false);
    setCheckoutPlan(null);
    setCheckoutError(null);
  };

  const handleConfirmCheckout = async () => {
    if (!user?.id || !checkoutPlan || isProcessing) return;

    setIsProcessing(true);
    setCheckoutError(null);

    try {
      const result = await startSubscriptionCheckout(checkoutPlan.id);

      if (result.mode === 'redirect') {
        window.location.assign(result.url);
        return;
      }

      await confirmDemoSubscription(user.id, checkoutPlan.id);
      await refreshProfile();
      setIsCheckoutOpen(false);
      navigate('/account?subscribed=1');
    } catch (error) {
      console.error('Erro no checkout:', error);
      setCheckoutError(
        error.message || 'Não foi possível concluir a assinatura. Tente novamente em instantes.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatedPage>
      <SeoHead
        title="Planos de Investigador | Dark Stream"
        description={DEFAULT_SITE_DESCRIPTION}
      />

      <SiteContainer className="py-10 md:py-16">
        <header className="mb-10 space-y-6 text-center md:mb-14">
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
            Assinatura Dark Stream
          </p>
          <h1 className="font-anton text-3xl uppercase leading-tight text-white sm:text-4xl md:text-5xl">
            Escolha o plano ideal para investigar
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-zinc-400">
            Desbloqueie casos exclusivos, qualidade premium e benefícios de investigador
            em toda a plataforma.
          </p>

          <div className="inline-flex border border-zinc-800 bg-zinc-950 p-1">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-5 py-2 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`px-5 py-2 text-[11px] font-mono uppercase tracking-wider transition-colors ${
                billingCycle === 'annual'
                  ? 'bg-brand-primary/15 text-brand-primary'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Anual
              <span className="ml-1.5 text-[9px] text-emerald-500">(Economize 20%)</span>
            </button>
          </div>
        </header>

        {checkoutError && !isCheckoutOpen && (
          <p className="mb-6 text-center text-sm text-red-400">{checkoutError}</p>
        )}

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <PlanCard
            plan={PLANS.monthly}
            billingCycle={billingCycle}
            highlighted={billingCycle === 'monthly'}
            onSubscribe={handleSubscribe}
          />
          <PlanCard
            plan={PLANS.annual}
            billingCycle={billingCycle}
            highlighted={billingCycle === 'annual'}
            onSubscribe={handleSubscribe}
          />
        </div>

        <p className="mt-10 text-center text-[10px] font-mono uppercase tracking-wider text-zinc-600">
          Já possui assinatura?{' '}
          <Link to="/account" className="text-brand-primary transition-colors hover:underline">
            Gerenciar na Minha Conta
          </Link>
        </p>
      </SiteContainer>

      <Transition appear show={isCheckoutOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeCheckout}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md border border-zinc-800 bg-zinc-950 p-6 shadow-2xl md:p-8">
                  <Dialog.Title className="text-lg font-mono uppercase tracking-wider text-white">
                    {stripeCheckoutEnabled ? 'Ir para pagamento' : 'Checkout demonstrativo'}
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-zinc-400">
                    {stripeCheckoutEnabled
                      ? 'Você será redirecionado ao checkout seguro do Stripe para concluir a assinatura.'
                      : 'Modo demo ativo — a assinatura será salva localmente sem cobrança real.'}
                  </p>

                  {checkoutPlan && (
                    <div className="mt-6 space-y-4 border border-zinc-800 bg-black/40 p-4">
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                          Plano
                        </p>
                        <p className="font-mono text-white">{checkoutPlan.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                          Total
                        </p>
                        <p className="font-mono text-brand-primary">
                          {checkoutPlan.price}
                          {checkoutPlan.cadence}
                        </p>
                      </div>
                      {stripeCheckoutEnabled ? (
                        <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                          Pagamento via Stripe · cartão ou Pix (conforme configuração da conta)
                        </p>
                      ) : (
                        <div className="border border-dashed border-zinc-800 px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                          Pagamento: Visa ·••• 4242 (demonstração)
                        </div>
                      )}
                    </div>
                  )}

                  {checkoutError && (
                    <p className="mt-4 text-sm text-red-400">{checkoutError}</p>
                  )}

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={closeCheckout}
                      disabled={isProcessing}
                      className="flex-1 border border-zinc-700 py-2.5 text-[11px] font-mono uppercase tracking-widest text-zinc-300 transition-colors hover:border-zinc-500 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmCheckout}
                      disabled={isProcessing}
                      className="flex-1 bg-brand-primary py-2.5 text-[11px] font-mono uppercase tracking-widest text-black transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                      {isProcessing
                        ? 'Processando...'
                        : stripeCheckoutEnabled
                          ? 'Continuar para Stripe'
                          : 'Confirmar assinatura'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </AnimatedPage>
  );
}
