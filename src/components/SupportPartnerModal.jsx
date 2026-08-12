import React, { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import LoadingSpinner from './LoadingSpinner';
import {
  confirmDemoPartnerSupport,
  isStripeCheckoutEnabled,
  startPartnerSupportCheckout,
} from '../utils/billing';

const PRESET_AMOUNTS = [
  { label: 'R$ 5', cents: 500 },
  { label: 'R$ 15', cents: 1500 },
  { label: 'R$ 30', cents: 3000 },
];

function parseCustomAmountToCents(value) {
  const normalized = String(value ?? '').replace(',', '.').trim();
  const reais = Number.parseFloat(normalized);
  if (!Number.isFinite(reais) || reais < 5 || reais > 500) return null;
  return Math.round(reais * 100);
}

export default function SupportPartnerModal({
  isOpen,
  onClose,
  partner,
  currentUser,
  returnPath,
  onSuccess,
}) {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_AMOUNTS[1].cents);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const amountCents = useMemo(() => {
    if (isCustom) {
      return parseCustomAmountToCents(customAmount);
    }
    return selectedPreset;
  }, [isCustom, customAmount, selectedPreset]);

  const formattedAmount = useMemo(() => {
    if (!amountCents) return null;
    return (amountCents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }, [amountCents]);

  const handleClose = () => {
    if (isProcessing) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!currentUser?.id || !partner?.id || !amountCents) {
      setError('Selecione um valor válido entre R$ 5 e R$ 500.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await startPartnerSupportCheckout(
        partner.id,
        amountCents,
        returnPath,
      );

      if (result.mode === 'redirect') {
        window.location.assign(result.url);
        return;
      }

      await confirmDemoPartnerSupport(currentUser.id, partner.id, amountCents);
      onSuccess?.();
      handleClose();
    } catch (submitError) {
      console.error('Erro no apoio ao parceiro:', submitError);
      setError(submitError.message || 'Não foi possível processar o apoio.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md border border-zinc-800 bg-black/95 p-6 shadow-2xl">
                <Dialog.Title className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                  Apoiar este Investigador
                </Dialog.Title>
                <p className="mt-2 text-sm text-zinc-400">
                  Contribua com
                  {' '}
                  <span className="text-amber-500">{partner?.username || 'o parceiro'}</span>
                  {' '}
                  e receba o selo
                  {' '}
                  <span className="font-mono text-[10px] uppercase text-amber-500">Detetive Apoiador</span>
                  {' '}
                  nos comentários e no fórum.
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_AMOUNTS.map((preset) => (
                      <button
                        key={preset.cents}
                        type="button"
                        onClick={() => {
                          setIsCustom(false);
                          setSelectedPreset(preset.cents);
                          setError(null);
                        }}
                        className={`rounded-none border px-3 py-3 font-mono text-xs font-bold uppercase tracking-wider transition-colors ${
                          !isCustom && selectedPreset === preset.cents
                            ? 'border-amber-500 bg-amber-500 text-black'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-amber-500/50'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustom(true);
                        setError(null);
                      }}
                      className={`mb-3 w-full rounded-none border px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        isCustom
                          ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-amber-500/50'
                      }`}
                    >
                      Valor Customizado
                    </button>

                    {isCustom && (
                      <label className="block">
                        <span className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                          Valor em reais (mín. R$ 5, máx. R$ 500)
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Ex: 25,00"
                          className="w-full rounded-none border border-zinc-800 bg-black/60 px-4 py-3 font-mono text-sm text-white outline-none transition-colors focus:border-amber-500"
                        />
                      </label>
                    )}
                  </div>

                  {formattedAmount && (
                    <p className="text-center font-mono text-xs uppercase tracking-wider text-zinc-500">
                      Total:
                      {' '}
                      <span className="text-amber-500">{formattedAmount}</span>
                    </p>
                  )}

                  {error && (
                    <p className="text-center text-sm text-red-400">{error}</p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isProcessing}
                      className="flex-1 rounded-none border border-zinc-700 px-4 py-3 font-mono text-xs uppercase tracking-wider text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing || !amountCents}
                      className="flex flex-1 items-center justify-center gap-2 rounded-none bg-amber-500 px-4 py-3 font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-amber-400 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <LoadingSpinner size="sm" label="" />
                          Processando…
                        </>
                      ) : (
                        isStripeCheckoutEnabled() ? 'Ir para pagamento' : 'Confirmar apoio demo'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
