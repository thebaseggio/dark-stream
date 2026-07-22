import React, { useEffect, useMemo, useState } from 'react';
import AnimatedPage from '../AnimatedPage';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';
import { useAuth } from '../contexts/AuthProvider';
import { PROFILE_FIELDS_SELECT, resolveAvatarUrl } from '../utils/profileMedia';
import { supabase } from '../supabase';

const INVESTIGATOR_PLANS = [
  {
    id: 'monthly',
    name: 'Mensal',
    price: 'R$ 19,90',
    cadence: '/mês',
    highlight: false,
    savings: null,
    benefits: [
      'Casos exclusivos para assinantes',
      'Crachá premium no fórum de teorias',
      'Dossiês e evidências para download',
    ],
  },
  {
    id: 'quarterly',
    name: 'Trimestral',
    price: 'R$ 49,90',
    cadence: '/trimestre',
    highlight: true,
    savings: 'Economize 16%',
    benefits: [
      'Tudo do plano Mensal',
      'Prioridade em comentários e teorias',
      'Alertas de novos casos vinculados',
    ],
  },
  {
    id: 'annual',
    name: 'Anual',
    price: 'R$ 179,90',
    cadence: '/ano',
    highlight: false,
    savings: 'Economize 25%',
    benefits: [
      'Tudo do plano Trimestral',
      'Acesso antecipado a estreias',
      'Selo Anual no perfil de investigador',
    ],
  },
];

function SectionCard({ title, subtitle, children, accent = false }) {
  return (
    <section
      className={`border bg-zinc-950/80 p-6 md:p-8 space-y-5 ${
        accent
          ? 'border-brand-primary/30 shadow-[0_0_40px_rgba(241,196,15,0.06)]'
          : 'border-zinc-800'
      }`}
    >
      <header className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
          {subtitle}
        </p>
        <h2 className="text-lg md:text-xl font-mono uppercase tracking-wider text-white">
          {title}
        </h2>
      </header>
      {children}
    </section>
  );
}

function PlanOptionCard({ plan, isCurrent, isSaving, onSelect }) {
  return (
    <article
      className={`relative flex flex-col border p-5 md:p-6 transition-colors ${
        plan.highlight
          ? 'border-brand-primary/50 bg-[linear-gradient(180deg,#140606_0%,#0a0a0a_100%)]'
          : 'border-zinc-800 bg-black/40 hover:border-zinc-700'
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-4 bg-brand-primary text-black text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5">
          Recomendado
        </span>
      )}

      <div className="space-y-1 mb-4">
        <h3 className="text-sm font-mono uppercase tracking-wider text-white">{plan.name}</h3>
        {plan.savings && (
          <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-500/90">
            {plan.savings}
          </p>
        )}
      </div>

      <div className="mb-5">
        <p className="text-2xl font-mono text-brand-primary">
          {plan.price}
          <span className="text-sm text-zinc-500">{plan.cadence}</span>
        </p>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {plan.benefits.map((benefit) => (
          <li key={benefit} className="flex gap-2 text-[12px] text-zinc-400 leading-snug">
            <span className="text-brand-primary shrink-0" aria-hidden="true">▸</span>
            {benefit}
          </li>
        ))}
      </ul>

      <button
        type="button"
        disabled={isCurrent || isSaving}
        onClick={() => onSelect(plan)}
        className={`w-full py-2.5 text-[11px] font-mono uppercase tracking-widest transition-colors ${
          isCurrent
            ? 'border border-zinc-700 text-zinc-500 cursor-default'
            : isSaving
              ? 'border border-zinc-700 text-zinc-600 cursor-wait'
            : plan.highlight
              ? 'bg-brand-primary text-black hover:opacity-90'
              : 'border border-zinc-700 text-zinc-200 hover:border-brand-primary/50 hover:text-brand-primary'
        }`}
      >
        {isCurrent ? 'Plano Atual' : isSaving ? 'Salvando...' : 'Selecionar Plano'}
      </button>
    </article>
  );
}

export default function AccountSettings() {
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth();
  const [accountLoading, setAccountLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);

  useEffect(() => {
    if (loading || profileLoading || !user?.id) return undefined;

    let isMounted = true;
    setAccountLoading(true);

    const loadAccountData = async () => {
      // Placeholder até integração com billing/Stripe no Supabase.
      const activePlanId = profile?.subscription_plan || null;
      const activeStatus = profile?.subscription_status || null;
      const savedPayment = profile?.payment_method_last4
        ? {
            brand: profile?.payment_method_brand || 'Cartão',
            last4: profile.payment_method_last4,
          }
        : null;

      if (!isMounted) return;

      setSelectedPlanId(activePlanId);
      setSubscriptionStatus(activeStatus);
      setPaymentMethod(savedPayment);
      setAccountLoading(false);
    };

    loadAccountData();

    return () => {
      isMounted = false;
    };
  }, [loading, profileLoading, user?.id, profile]);

  const currentPlan = useMemo(() => {
    if (!selectedPlanId) {
      return {
        id: 'free',
        label: 'Gratuito / Recruta',
        description: 'Acesso ao catálogo público, crachá de investigador e participação básica na comunidade.',
        isPaid: false,
      };
    }

    const matched = INVESTIGATOR_PLANS.find((plan) => plan.id === selectedPlanId);
    const isActive = subscriptionStatus === 'active';
    return {
      id: selectedPlanId,
      label: matched
        ? `Investigador — Plano ${matched.name}`
        : 'Investigador Premium',
      description: 'Plano ativo com benefícios premium desbloqueados.',
      isPaid: true,
      isActive,
    };
  }, [selectedPlanId, subscriptionStatus]);

  const avatarUrl = resolveAvatarUrl(profile);

  const handleSelectPlan = async (plan) => {
    if (!user?.id || selectedPlanId === plan.id || isSavingPlan) return;

    setIsSavingPlan(true);
    setPlanError(null);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: plan.id,
        subscription_status: 'active',
      })
      .eq('id', user.id)
      .select(PROFILE_FIELDS_SELECT)
      .single();

    if (error) {
      console.error('Erro ao atualizar plano no Supabase:', error);
      setPlanError('Não foi possível salvar o plano. Verifique se a migration de assinatura foi aplicada.');
      setIsSavingPlan(false);
      return;
    }

    setSelectedPlanId(data.subscription_plan);
    setSubscriptionStatus(data.subscription_status);
    await refreshProfile();
    setIsSavingPlan(false);
  };

  const handleAddCard = () => {
    setPaymentMethod({
      brand: 'Visa',
      last4: '4242',
    });
  };

  if (loading || profileLoading || accountLoading) {
    return (
      <AnimatedPage>
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500 animate-pulse">
            Carregando credenciais...
          </p>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <SeoHead
        title="Gerenciar Conta e Planos | Dark Stream"
        description={DEFAULT_SITE_DESCRIPTION}
      />

      <div className="max-w-5xl mx-auto py-8 md:py-12 space-y-8 md:space-y-10">
        <header className="space-y-4 border-b border-zinc-800/80 pb-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
            Central de Credenciais
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-mono uppercase tracking-wider text-white">
                Gerenciar Conta / Planos
              </h1>
              <p className="text-sm text-zinc-400 max-w-2xl">
                Controle sua assinatura de investigador, forma de pagamento e nível de acesso
                na plataforma Dark Stream.
              </p>
            </div>
            {profile?.username && (
              <div className="flex items-center gap-3 border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.username}
                    className="w-10 h-10 rounded-md object-cover border border-zinc-800"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-zinc-900 border border-zinc-800" />
                )}
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                    Investigador
                  </p>
                  <p className="text-sm font-mono text-brand-primary">{profile.username}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        <SectionCard
          title="Informações do Plano"
          subtitle="Status da assinatura"
          accent={!currentPlan.isPaid}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                Plano atual
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-xl font-mono uppercase tracking-wider text-white">
                  {currentPlan.label}
                </p>
                {currentPlan.isPaid && currentPlan.isActive && (
                  <span className="inline-flex items-center border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                    Ativo
                  </span>
                )}
              </div>
              <p className="text-sm text-zinc-400 max-w-xl">{currentPlan.description}</p>
              {planError && (
                <p className="text-sm text-red-400">{planError}</p>
              )}
            </div>

            {!currentPlan.isPaid && (
              <a
                href="#planos"
                className="inline-flex justify-center shrink-0 bg-[linear-gradient(135deg,#140606_0%,#2a0a0a_100%)] border border-red-900/40 px-6 py-3 text-[11px] font-mono uppercase tracking-widest text-brand-primary hover:border-brand-primary/40 transition-colors"
              >
                Assinar plano investigador
              </a>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Forma de Pagamento" subtitle="Billing">
          {paymentMethod ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-zinc-800 bg-black/30 px-5 py-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mb-1">
                  Cartão cadastrado
                </p>
                <p className="text-sm font-mono text-zinc-200">
                  {paymentMethod.brand} ·••• {paymentMethod.last4}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCard}
                className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 hover:text-brand-primary transition-colors"
              >
                Atualizar cartão
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border border-dashed border-zinc-800 px-5 py-6">
              <p className="text-sm text-zinc-500">
                Nenhum método de pagamento cadastrado.
              </p>
              <button
                type="button"
                onClick={handleAddCard}
                className="border border-zinc-700 px-5 py-2.5 text-[11px] font-mono uppercase tracking-widest text-zinc-200 hover:border-brand-primary/50 hover:text-brand-primary transition-colors"
              >
                Adicionar Cartão
              </button>
            </div>
          )}
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
            Integração de pagamento em breve — fluxo demonstrativo local.
          </p>
        </SectionCard>

        <div id="planos" className="scroll-mt-8 space-y-5">
          <header className="space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
              Escolha seu nível
            </p>
            <h2 className="text-lg md:text-xl font-mono uppercase tracking-wider text-white">
              Planos de Investigador
            </h2>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
            {INVESTIGATOR_PLANS.map((plan) => (
              <PlanOptionCard
                key={plan.id}
                plan={plan}
                isCurrent={selectedPlanId === plan.id && subscriptionStatus === 'active'}
                isSaving={isSavingPlan}
                onSelect={handleSelectPlan}
              />
            ))}
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
