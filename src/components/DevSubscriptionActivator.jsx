import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import {
  forceActivateDevSubscription,
  hasActiveSubscription,
  isDevSubscriptionToolsEnabled,
} from '../utils/subscriptionAccess';

export default function DevSubscriptionActivator({ onActivated, autoActivate = false }) {
  const { user, profile, refreshProfile } = useAuth();
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  const isSubscriber = hasActiveSubscription(profile);

  const activate = useCallback(async () => {
    if (!user?.id || isSubscriber || status === 'loading') return;

    setStatus('loading');
    setMessage('');

    try {
      await forceActivateDevSubscription(user.id);
      await refreshProfile();
      setStatus('success');
      setMessage('Assinatura de dev ativada.');
      onActivated?.();
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'Falha ao ativar assinatura de dev.');
    }
  }, [user?.id, isSubscriber, status, refreshProfile, onActivated]);

  useEffect(() => {
    if (autoActivate && user?.id && !isSubscriber && status === 'idle') {
      activate();
    }
  }, [autoActivate, user?.id, isSubscriber, status, activate]);

  if (!isDevSubscriptionToolsEnabled()) {
    return null;
  }

  if (isSubscriber) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-emerald-400">
        [DEV] Assinatura ativa nesta conta.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-950/20 px-4 py-4">
      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400">
        Ferramenta de desenvolvimento
      </p>
      <p className="mt-2 text-sm text-zinc-400">
        Ative uma assinatura fake no Supabase para testar rotas protegidas localmente.
      </p>
      <button
        type="button"
        onClick={activate}
        disabled={!user?.id || status === 'loading'}
        className="mt-3 rounded-lg border border-amber-500/50 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-amber-300 transition-colors hover:bg-amber-500/10 disabled:opacity-50"
      >
        {status === 'loading' ? 'Ativando…' : 'Ativar assinatura (DEV)'}
      </button>
      {message && (
        <p className={`mt-2 text-xs font-mono ${status === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
