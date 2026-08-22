import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AnimatedPage from '../AnimatedPage';
import SiteContainer from '../components/SiteContainer';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';
import { useAuth } from '../contexts/AuthProvider';
import { PROFILE_FIELDS_SELECT, resolveAvatarUrl } from '../utils/profileMedia';
import {
  isPartnerAccount,
  shouldShowChannelProfileNav,
} from '../utils/partnerAccess';
import { supabase } from '../supabase';
import { useNotification } from '../contexts/NotificationProvider';
import ProfileEditor from '../components/ProfileEditor';
import LoadingSpinner from '../components/LoadingSpinner';

const INVESTIGATOR_TABS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'subscription', label: 'Assinatura' },
  { id: 'security', label: 'Segurança' },
  { id: 'devices', label: 'Aparelhos' },
];

const PARTNER_TABS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'channel', label: 'Perfil do Canal' },
  { id: 'payout', label: 'Repasse / Pix' },
  { id: 'security', label: 'Segurança' },
  { id: 'devices', label: 'Aparelhos' },
];

const VALID_TAB_IDS = {
  investigator: INVESTIGATOR_TABS.map((tab) => tab.id),
  partner: PARTNER_TABS.map((tab) => tab.id),
};

function resolveInitialTab(searchParams) {
  return normalizeAccountTab(searchParams.get('tab'));
}

function isAllowedAccountTab(tabId, partnerNav, allowChannelProfile = false) {
  if (tabId === 'channel' && allowChannelProfile) return true;
  const allowed = partnerNav ? VALID_TAB_IDS.partner : VALID_TAB_IDS.investigator;
  return allowed.includes(tabId);
}

function normalizeAccountTab(tabId) {
  if (!tabId) return 'overview';
  if (tabId === 'channel-profile') return 'channel';
  return tabId;
}

const CHANNEL_PROFILE_TAB = { id: 'channel', label: 'Perfil do Canal' };

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

const MOCK_DEVICES = [
  { id: '1', name: 'Windows · Chrome', location: 'São Paulo, BR', lastActive: 'Agora', current: true },
  { id: '2', name: 'iPhone · Safari', location: 'São Paulo, BR', lastActive: 'Há 2 dias', current: false },
];

function SectionCard({ title, subtitle, children, accent = false }) {
  return (
    <section
      className={`space-y-5 border bg-zinc-950/80 p-6 md:p-8 ${
        accent
          ? 'border-brand-primary/30 shadow-[0_0_40px_rgba(241,196,15,0.06)]'
          : 'border-zinc-800'
      }`}
    >
      {(title || subtitle) && (
        <header className="space-y-1">
          {subtitle && (
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
              {subtitle}
            </p>
          )}
          {title && (
            <h2 className="text-lg font-mono uppercase tracking-wider text-white md:text-xl">
              {title}
            </h2>
          )}
        </header>
      )}
      {children}
    </section>
  );
}

function PlanOptionCard({ plan, isCurrent, isSaving, onSelect }) {
  return (
    <article
      className={`relative flex flex-col border p-5 transition-colors md:p-6 ${
        plan.highlight
          ? 'border-brand-primary/50 bg-[linear-gradient(180deg,#140606_0%,#0a0a0a_100%)]'
          : 'border-zinc-800 bg-black/40 hover:border-zinc-700'
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-4 bg-brand-primary px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-black">
          Recomendado
        </span>
      )}

      <div className="mb-4 space-y-1">
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

      <ul className="mb-6 flex-1 space-y-2">
        {plan.benefits.map((benefit) => (
          <li key={benefit} className="flex gap-2 text-[12px] leading-snug text-zinc-400">
            <span className="shrink-0 text-brand-primary" aria-hidden="true">▸</span>
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
            ? 'cursor-default border border-zinc-700 text-zinc-500'
            : isSaving
              ? 'cursor-wait border border-zinc-700 text-zinc-600'
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

function QuickLink({ children, onClick, to }) {
  const className =
    'flex w-full items-center justify-between border border-zinc-800 bg-black/30 px-4 py-3 text-left transition-colors hover:border-brand-primary/40 hover:bg-zinc-900/50';

  if (to) {
    return (
      <Link to={to} className={className}>
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">{children}</span>
        <span className="text-brand-primary" aria-hidden="true">→</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-300">{children}</span>
      <span className="text-brand-primary" aria-hidden="true">→</span>
    </button>
  );
}

function TabPlaceholder({ title, description }) {
  return (
    <SectionCard title={title} subtitle="Em breve">
      <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
    </SectionCard>
  );
}

export default function AccountSettings() {
  const { user, profile, loading, profileLoading, refreshProfile } = useAuth();
  const { showNotification } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const isPartner = isPartnerAccount(profile);
  const showChannelProfileNav = shouldShowChannelProfileNav(profile, tabFromUrl);
  const [activeTab, setActiveTab] = useState(() => resolveInitialTab(searchParams));
  const [accountLoading, setAccountLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [payoutPixKey, setPayoutPixKey] = useState('');
  const [payoutBankDetails, setPayoutBankDetails] = useState('');
  const [isSavingPayout, setIsSavingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState(null);
  const [payoutSaved, setPayoutSaved] = useState(false);
  const [channelProfileSaved, setChannelProfileSaved] = useState(false);
  const subscriptionSuccess = searchParams.get('subscribed') === '1';

  const accountTabs = useMemo(() => {
    const baseTabs = isPartner ? [...PARTNER_TABS] : [...INVESTIGATOR_TABS];

    if (showChannelProfileNav && !baseTabs.some((tab) => tab.id === 'channel')) {
      const overviewIndex = baseTabs.findIndex((tab) => tab.id === 'overview');
      const insertAt = overviewIndex >= 0 ? overviewIndex + 1 : 0;
      return [
        ...baseTabs.slice(0, insertAt),
        CHANNEL_PROFILE_TAB,
        ...baseTabs.slice(insertAt),
      ];
    }

    return baseTabs;
  }, [isPartner, showChannelProfileNav]);

  useEffect(() => {
    if (!subscriptionSuccess) return undefined;
    const timer = setTimeout(() => {
      setSearchParams({}, { replace: true });
    }, 6000);
    return () => clearTimeout(timer);
  }, [subscriptionSuccess, setSearchParams]);

  useEffect(() => {
    if (loading || profileLoading || !user?.id) return undefined;

    let isMounted = true;
    setAccountLoading(true);

    const loadAccountData = async () => {
      const activePlanId = profile?.subscription_plan || null;
      const activeStatus = profile?.subscription_status || null;
      const savedPayment = profile?.payment_method_last4
        ? {
            brand: profile?.payment_method_brand || 'Cartão',
            last4: profile.payment_method_last4,
          }
        : { brand: 'Pix', last4: null, isPix: true };

      if (!isMounted) return;

      setSelectedPlanId(activePlanId);
      setSubscriptionStatus(activeStatus);
      setPaymentMethod(savedPayment);
      setPayoutPixKey(profile?.payout_pix_key || '');
      setPayoutBankDetails(profile?.payout_bank_details || '');
      setAccountLoading(false);
    };

    loadAccountData();

    return () => {
      isMounted = false;
    };
  }, [loading, profileLoading, user?.id, profile]);

  useEffect(() => {
    if (isPartner && activeTab === 'subscription') {
      setActiveTab('overview');
    }
  }, [isPartner, activeTab]);

  useEffect(() => {
    if (loading || profileLoading) return;

    const tabParam = normalizeAccountTab(searchParams.get('tab'));

    const allowChannelProfile = shouldShowChannelProfileNav(profile, tabParam);

    if (tabParam === 'channel' && allowChannelProfile) {
      setActiveTab('channel');
      return;
    }

    if (isAllowedAccountTab(tabParam, isPartner, allowChannelProfile)) {
      setActiveTab(tabParam);
      return;
    }

    setActiveTab('overview');
    setSearchParams({}, { replace: true });
  }, [loading, profileLoading, isPartner, profile, searchParams, setSearchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setChannelProfileSaved(false);
    if (tabId === 'overview') {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: tabId }, { replace: true });
    }
  };

  const handleChannelProfileSuccess = (type, message) => {
    if (type === 'success') {
      setChannelProfileSaved(true);
      window.setTimeout(() => setChannelProfileSaved(false), 6000);
      return;
    }
    showNotification?.(type, message);
  };

  const handleChannelProfileSaved = async () => {
    await refreshProfile();
  };

  const currentPlan = useMemo(() => {
    if (!selectedPlanId) {
      return {
        id: 'free',
        label: 'Gratuito / Recruta',
        description: 'Acesso ao catálogo público e participação básica na comunidade.',
        isPaid: false,
        price: 'R$ 0,00',
      };
    }

    const matched = INVESTIGATOR_PLANS.find((plan) => plan.id === selectedPlanId);
    const isActive = subscriptionStatus === 'active';
    return {
      id: selectedPlanId,
      label: matched ? `Investigador — Plano ${matched.name}` : 'Investigador Premium',
      description: 'Plano ativo com benefícios premium desbloqueados.',
      isPaid: true,
      isActive,
      price: matched?.price || '—',
      cadence: matched?.cadence || '',
    };
  }, [selectedPlanId, subscriptionStatus]);

  const memberSinceYear = useMemo(() => {
    if (profile?.created_at) {
      return new Date(profile.created_at).getFullYear();
    }
    return 2026;
  }, [profile?.created_at]);

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
      isPix: false,
    });
  };

  const handleSavePayout = async (event) => {
    event.preventDefault();
    if (!user?.id || isSavingPayout) return;

    setIsSavingPayout(true);
    setPayoutError(null);
    setPayoutSaved(false);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        payout_pix_key: payoutPixKey.trim() || null,
        payout_bank_details: payoutBankDetails.trim() || null,
      })
      .eq('id', user.id)
      .select(PROFILE_FIELDS_SELECT)
      .single();

    if (error) {
      console.error('Erro ao salvar dados de repasse:', error);
      setPayoutError('Não foi possível salvar os dados de repasse.');
      setIsSavingPayout(false);
      return;
    }

    setPayoutPixKey(data.payout_pix_key || '');
    setPayoutBankDetails(data.payout_bank_details || '');
    await refreshProfile();
    setPayoutSaved(true);
    setIsSavingPayout(false);
  };

  const renderPartnerOverview = () => {
    const hasPayoutData = Boolean(payoutPixKey.trim() || payoutBankDetails.trim());

    return (
      <div className="space-y-6">
        <SectionCard accent>
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-brand-primary">
                Parceiro verificado
              </p>
              <h2 className="text-xl font-mono uppercase tracking-wider text-white md:text-2xl">
                Conta de Parceiro
              </h2>
              <span className="inline-flex items-center border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                Ativo • Monetização Habilitada
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 border-t border-zinc-800 pt-6 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Chave Pix
                </p>
                <p className="text-sm font-mono text-zinc-200 break-all">
                  {payoutPixKey.trim() || 'Não cadastrada'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Dados bancários
                </p>
                <p className="text-sm font-mono text-zinc-200 whitespace-pre-wrap">
                  {payoutBankDetails.trim() || 'Não cadastrados'}
                </p>
              </div>
            </div>

            {!hasPayoutData && (
              <button
                type="button"
                onClick={() => handleTabChange('payout')}
                className="text-[11px] font-mono uppercase tracking-wider text-brand-primary transition-colors hover:underline"
              >
                Cadastrar dados para repasse mensal →
              </button>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Atalhos Rápidos" subtitle="Central da conta">
          <div className="space-y-2">
            <QuickLink to="/partner/dashboard">Painel do Parceiro</QuickLink>
            <QuickLink onClick={() => handleTabChange('channel')}>Perfil do Canal</QuickLink>
            <QuickLink onClick={() => handleTabChange('payout')}>Dados de Repasse / Pix</QuickLink>
            <QuickLink onClick={() => handleTabChange('security')}>Segurança e Senha</QuickLink>
          </div>
        </SectionCard>
      </div>
    );
  };

  const renderChannelProfile = () => (
    <div className="space-y-6">
      {channelProfileSaved && (
        <div className="border border-brand-primary/50 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
          Perfil do Parceiro atualizado com sucesso!
        </div>
      )}

      <SectionCard title="Perfil do Canal" subtitle="Identidade pública">
        <p className="text-sm leading-relaxed text-zinc-400">
          Atualize avatar, banner, bio e redes sociais exibidos na página pública do seu canal.
        </p>

        {user?.id && profile ? (
          <div className="mt-6">
            <ProfileEditor
              user={user}
              profile={profile}
              mode="partner"
              saveSuccessMessage="Perfil do Parceiro atualizado com sucesso!"
              onSuccess={handleChannelProfileSuccess}
              onSaveComplete={handleChannelProfileSaved}
              onUploadSuccess={handleChannelProfileSaved}
            />
          </div>
        ) : (
          <p className="mt-6 text-sm text-zinc-500">Carregando perfil do canal…</p>
        )}
      </SectionCard>
    </div>
  );

  const renderPayout = () => (
    <div className="space-y-6">
      <SectionCard title="Dados de Repasse" subtitle="Monetização">
        <p className="text-sm leading-relaxed text-zinc-400">
          Informe a chave Pix ou dados bancários para receber o repasse mensal dos seus casos.
        </p>

        <form onSubmit={handleSavePayout} className="mt-6 space-y-5">
          <div>
            <label htmlFor="payout-pix" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Chave Pix
            </label>
            <input
              id="payout-pix"
              type="text"
              value={payoutPixKey}
              onChange={(e) => setPayoutPixKey(e.target.value)}
              placeholder="E-mail, CPF, telefone ou chave aleatória"
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 font-mono text-sm text-white focus:border-brand-primary focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="payout-bank" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Dados bancários (opcional)
            </label>
            <textarea
              id="payout-bank"
              rows="3"
              value={payoutBankDetails}
              onChange={(e) => setPayoutBankDetails(e.target.value)}
              placeholder="Banco, agência, conta, titular…"
              className="mt-2 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-sm text-white focus:border-brand-primary focus:outline-none"
            />
          </div>

          {payoutError && <p className="text-sm text-red-400">{payoutError}</p>}
          {payoutSaved && (
            <p className="text-sm text-emerald-400">Dados de repasse salvos com sucesso.</p>
          )}

          <button
            type="submit"
            disabled={isSavingPayout}
            className="rounded-lg bg-brand-primary px-6 py-3 font-mono text-xs uppercase tracking-wider text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isSavingPayout ? 'Salvando…' : 'Salvar dados de repasse'}
          </button>
        </form>
      </SectionCard>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      <SectionCard accent={currentPlan.isPaid}>
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-brand-primary">
                {currentPlan.isPaid ? `Assinante desde ${memberSinceYear}` : 'Conta gratuita'}
              </p>
              <h2 className="text-xl font-mono uppercase tracking-wider text-white md:text-2xl">
                {currentPlan.label}
              </h2>
              {currentPlan.isPaid && currentPlan.isActive && (
                <span className="inline-flex items-center border border-emerald-500/40 bg-emerald-950/30 px-2.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-400">
                  Ativo
                </span>
              )}
            </div>
            {currentPlan.isPaid && (
              <p className="text-right font-mono text-brand-primary">
                {currentPlan.price}
                <span className="text-sm text-zinc-500">{currentPlan.cadence}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 border-t border-zinc-800 pt-6 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Próxima cobrança
              </p>
              <p className="text-sm font-mono text-zinc-200">
                {currentPlan.isPaid ? '15/03/2026' : '—'}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Forma de pagamento
              </p>
              <p className="text-sm font-mono text-zinc-200">
                {paymentMethod?.isPix
                  ? 'Pix (cadastrado)'
                  : paymentMethod?.last4
                    ? `${paymentMethod.brand} ·••• ${paymentMethod.last4}`
                    : 'Não cadastrado'}
              </p>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Atalhos Rápidos" subtitle="Central da conta">
        <div className="space-y-2">
          <QuickLink to="/plans">Alterar plano</QuickLink>
          <QuickLink onClick={() => handleTabChange('subscription')}>Gerenciar forma de pagamento</QuickLink>
          <QuickLink onClick={() => handleTabChange('devices')}>Gerenciar aparelhos</QuickLink>
        </div>
      </SectionCard>
    </div>
  );

  const renderSubscription = () => (
    <div className="space-y-6">
      <SectionCard title="Informações do Plano" subtitle="Assinatura">
        <div className="space-y-2">
          <p className="text-xl font-mono uppercase tracking-wider text-white">{currentPlan.label}</p>
          <p className="text-sm text-zinc-400">{currentPlan.description}</p>
          {planError && <p className="text-sm text-red-400">{planError}</p>}
        </div>
      </SectionCard>

      <SectionCard title="Forma de Pagamento" subtitle="Billing">
        {paymentMethod && !paymentMethod.isPix ? (
          <div className="flex flex-col gap-4 border border-zinc-800 bg-black/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Cartão cadastrado
              </p>
              <p className="text-sm font-mono text-zinc-200">
                {paymentMethod.brand} ·••• {paymentMethod.last4}
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddCard}
              className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 transition-colors hover:text-brand-primary"
            >
              Atualizar cartão
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 border border-dashed border-zinc-800 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-zinc-500">
              {paymentMethod?.isPix ? 'Pix cadastrado como forma de pagamento.' : 'Nenhum método cadastrado.'}
            </p>
            <button
              type="button"
              onClick={handleAddCard}
              className="border border-zinc-700 px-5 py-2.5 text-[11px] font-mono uppercase tracking-widest text-zinc-200 transition-colors hover:border-brand-primary/50 hover:text-brand-primary"
            >
              {paymentMethod?.isPix ? 'Alterar para cartão' : 'Adicionar cartão'}
            </button>
          </div>
        )}
        <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
          Integração de pagamento em breve — fluxo demonstrativo local.
        </p>
      </SectionCard>

      <div className="space-y-5">
        <header className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
            Escolha seu nível
          </p>
          <h2 className="text-lg font-mono uppercase tracking-wider text-white md:text-xl">
            Planos de Investigador
          </h2>
        </header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
  );

  const renderSecurity = () => (
    <TabPlaceholder
      title="Segurança"
      description="Em breve você poderá alterar sua senha, ativar verificação em duas etapas e revisar sessões ativas da conta."
    />
  );

  const renderDevices = () => (
    <div className="space-y-6">
      <SectionCard title="Aparelhos Conectados" subtitle="Sessões ativas">
        <ul className="divide-y divide-zinc-800">
          {MOCK_DEVICES.map((device) => (
            <li
              key={device.id}
              className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-mono text-white">{device.name}</p>
                <p className="text-[11px] text-zinc-500">
                  {device.location} · {device.lastActive}
                </p>
              </div>
              {device.current ? (
                <span className="text-[10px] font-mono uppercase tracking-wider text-brand-primary">
                  Este aparelho
                </span>
              ) : (
                <button
                  type="button"
                  className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 transition-colors hover:text-red-400"
                >
                  Encerrar sessão
                </button>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );

  const tabContent = {
    overview: isPartner ? renderPartnerOverview : renderOverview,
    channel: renderChannelProfile,
    subscription: renderSubscription,
    payout: renderPayout,
    security: renderSecurity,
    devices: renderDevices,
  };

  if (loading || profileLoading || accountLoading) {
    return (
      <AnimatedPage>
        <SiteContainer className="py-12">
          <div className="flex min-h-[50vh] items-center justify-center">
            <LoadingSpinner size="md" label="Carregando credenciais..." />
          </div>
        </SiteContainer>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <SeoHead
        title="Minha Conta | Dark Stream"
        description={DEFAULT_SITE_DESCRIPTION}
      />

      <SiteContainer className="py-8 md:py-12">
        <header className="mb-8 space-y-4 border-b border-zinc-800 pb-8">
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
            Central de Configurações
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-mono uppercase tracking-wider text-white md:text-3xl">
                Minha Conta
              </h1>
              <p className="max-w-2xl text-sm text-zinc-400">
                {isPartner
                  ? 'Gerencie perfil do canal, repasse, segurança e aparelhos conectados da sua conta de parceiro.'
                  : 'Gerencie assinatura, pagamento, segurança e aparelhos conectados.'}
              </p>
            </div>
            {profile?.username && (
              <div className="flex items-center gap-3 border border-zinc-800 bg-zinc-950/60 px-4 py-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.username}
                    className="h-10 w-10 rounded-md border border-zinc-800 object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-md border border-zinc-800 bg-zinc-900" />
                )}
                <div>
                  {isPartner ? (
                    <span className="inline-flex items-center rounded-full border border-brand-primary/40 bg-brand-primary/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-widest text-brand-primary shadow-[0_0_10px_rgba(241,196,15,0.2)]">
                      Parceiro Oficial
                    </span>
                  ) : (
                    <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      Investigador
                    </p>
                  )}
                  <p className="text-sm font-mono text-brand-primary">{profile.username}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {isPartner && channelProfileSaved && activeTab !== 'channel' && (
          <div className="mb-8 border border-brand-primary/50 bg-brand-primary/10 px-4 py-3 text-sm text-brand-primary">
            Perfil do Parceiro atualizado com sucesso!
          </div>
        )}

        {!isPartner && subscriptionSuccess && (
          <div className="mb-8 border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-300">
            Assinatura confirmada. Seu plano será atualizado em instantes após a confirmação do pagamento.
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <nav
            className="space-y-1 md:col-span-1"
            aria-label="Configurações da conta"
          >
            {accountTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full border px-4 py-3 text-left text-[11px] font-mono uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary'
                      : 'border-zinc-800 bg-zinc-950/50 text-zinc-400 hover:border-zinc-700 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="md:col-span-3">
            {tabContent[activeTab]?.()}
          </div>
        </div>
      </SiteContainer>
    </AnimatedPage>
  );
}
