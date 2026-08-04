import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import SiteContainer from '../components/SiteContainer';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';
import CreatorUploadForm from './CreatorUploadForm';
import {
  fetchPartnerDashboardData,
  getVideoPublishStatus,
  canAccessPartnerDashboard,
  isDashboardPrivileged,
  REVENUE_PER_HOUR_BRL,
} from '../utils/partnerDashboardMetrics';

const PERIOD_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
];

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function formatDate(dateValue) {
  if (!dateValue) return '—';
  return new Date(dateValue).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function MetricCard({ label, value, hint, change, loading }) {
  const isPositive = typeof change === 'number' && change >= 0;

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6">
      <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-3 font-anton text-3xl sm:text-4xl tabular-nums text-white">
        {loading ? '—' : value}
      </p>
      {typeof change === 'number' && !loading && (
        <p className={`mt-2 text-xs font-mono uppercase tracking-wider ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {isPositive ? '+' : ''}
          {change}
          % vs período anterior
        </p>
      )}
      {hint && (
        <p className="mt-2 text-[10px] font-mono uppercase tracking-wider text-zinc-600">{hint}</p>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'published') {
    return (
      <span className="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
        Publicado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-brand-primary/30 bg-brand-primary/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-brand-primary">
      Em processamento
    </span>
  );
}

function ViewsTrendChart({ data, loading }) {
  const max = Math.max(...(data || []).map((item) => item.count), 1);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Visualizações</p>
          <h3 className="mt-1 font-anton text-xl text-white">Tendência do período</h3>
        </div>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded bg-zinc-800/50" />
      ) : (
        <div className="flex h-40 items-end gap-1.5 sm:gap-2">
          {(data || []).map((item) => (
            <div key={item.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t bg-brand-primary/80 transition-all duration-300"
                  style={{ height: `${Math.max(8, (item.count / max) * 100)}%` }}
                  title={`${item.count} views`}
                />
              </div>
              <span className="truncate text-[9px] font-mono uppercase tracking-wider text-zinc-600">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PartnerDashboard({ user, profile, onSuccess }) {
  const [periodDays, setPeriodDays] = useState(30);
  const [metrics, setMetrics] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isAdminView, setIsAdminView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [videoToEdit, setVideoToEdit] = useState(null);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const notify = useCallback((type, message) => {
    onSuccess?.(type, message);
  }, [onSuccess]);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    const dashboardData = await fetchPartnerDashboardData(
      supabase,
      user.id,
      profile,
      periodDays,
    );

    setMetrics(dashboardData.metrics);
    setVideos(dashboardData.videos);
    setIsAdminView(dashboardData.isAdminView);
    setLoading(false);
  }, [user?.id, profile, periodDays]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const openUploadModal = () => {
    setVideoToEdit(null);
    setIsUploadOpen(true);
  };

  const openEditModal = (video) => {
    setVideoToEdit(video);
    setIsUploadOpen(true);
  };

  const closeUploadModal = () => {
    setIsUploadOpen(false);
    setTimeout(() => setVideoToEdit(null), 300);
  };

  const handleUploadSuccess = () => {
    closeUploadModal();
    loadDashboard();
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete || !user?.id) return;

    setIsDeleting(true);

    let deleteQuery = supabase
      .from('videos')
      .delete()
      .eq('id', videoToDelete.id);

    if (!isDashboardPrivileged(profile)) {
      deleteQuery = deleteQuery.eq('creator_id', user.id);
    }

    const { error } = await deleteQuery;

    if (error) {
      notify('error', `Erro: ${error.message}`);
    } else {
      notify('success', 'Caso removido com sucesso.');
      setVideoToDelete(null);
      loadDashboard();
    }

    setIsDeleting(false);
  };

  if (!user || !canAccessPartnerDashboard(profile)) {
    return (
      <AnimatedPage>
        <SiteContainer className="py-16 text-center text-zinc-500">
          Acesso restrito a parceiros verificados.
        </SiteContainer>
      </AnimatedPage>
    );
  }

  return (
    <>
      <SeoHead title="Painel do Parceiro | Dark Stream" description={DEFAULT_SITE_DESCRIPTION} />

      <AnimatedPage>
        <SiteContainer className="py-8 md:py-10">
          <div className="space-y-8 md:space-y-10">
            <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-primary">
                  Dark Stream Studio
                </p>
                <h1 className="mt-2 font-anton text-3xl sm:text-4xl text-white tracking-wide">
                  Painel do Parceiro
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                  Acompanhe performance, repasse estimado e gerencie seu catálogo de casos.
                  {isAdminView && (
                    <span className="mt-1 block text-brand-primary/80">
                      Modo administrador: exibindo todos os casos cadastrados.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900/80 p-1">
                  {PERIOD_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPeriodDays(option.value)}
                      className={`rounded-md px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${
                        periodDays === option.value
                          ? 'bg-brand-primary text-black'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={openUploadModal}
                  className="touch-target rounded-lg bg-brand-primary px-5 py-3 font-mono text-xs uppercase tracking-wider text-black transition-opacity hover:opacity-90"
                >
                  + Novo Caso
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Visualizações Totais"
                value={(metrics?.totalViews ?? 0).toLocaleString('pt-BR')}
                change={metrics?.viewsChangePercent}
                loading={loading}
              />
              <MetricCard
                label="Horas Assistidas"
                value={`${(metrics?.hoursWatched ?? 0).toLocaleString('pt-BR')}h`}
                hint="Retenção acumulada no período"
                loading={loading}
              />
              <MetricCard
                label="Receita Estimada"
                value={formatCurrency(metrics?.estimatedRevenue ?? 0)}
                hint={`RPM: R$ ${REVENUE_PER_HOUR_BRL.toFixed(2).replace('.', ',')} / hora assistida`}
                loading={loading}
              />
              <MetricCard
                label="Média de Retenção"
                value={`${metrics?.averageRetention ?? 0}%`}
                hint="Progresso médio por sessão"
                loading={loading}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MetricCard
                label="Casos Favoritados"
                value={(metrics?.favoritedCount ?? 0).toLocaleString('pt-BR')}
                hint="Adições à Minha Lista no período"
                loading={loading}
              />
              <MetricCard
                label="Taxa de Conclusão Média"
                value={`${metrics?.completionRate ?? 0}%`}
                hint="Usuários que assistiram mais de 80%"
                loading={loading}
              />
            </div>

            <ViewsTrendChart data={metrics?.viewsTrend} loading={loading} />

            <section className="rounded-lg border border-zinc-800 bg-zinc-900/80 overflow-hidden">
              <div className="flex flex-col gap-3 border-b border-zinc-800 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="font-anton text-xl text-white">Gestão de Conteúdo</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {videos.length}
                    {' '}
                    {videos.length === 1 ? 'caso publicado' : 'casos publicados'}
                  </p>
                </div>
              </div>

              {loading ? (
                <p className="px-6 py-12 text-center text-sm text-zinc-500">Carregando catálogo…</p>
              ) : videos.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-sm text-zinc-500">Nenhum caso cadastrado ainda.</p>
                  <button
                    type="button"
                    onClick={openUploadModal}
                    className="mt-4 font-mono text-xs uppercase tracking-wider text-brand-primary hover:underline"
                  >
                    Publicar primeiro caso
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="border-b border-zinc-800 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                        <th className="px-5 py-4 sm:px-6 font-normal">Caso</th>
                        <th className="px-4 py-4 font-normal hidden md:table-cell">Envio</th>
                        <th className="px-4 py-4 font-normal hidden sm:table-cell">Views</th>
                        <th className="px-4 py-4 font-normal hidden lg:table-cell">Minha Lista</th>
                        <th className="px-4 py-4 font-normal">Status</th>
                        <th className="px-5 py-4 sm:px-6 font-normal text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videos.map((video) => {
                        const status = getVideoPublishStatus(video);

                        return (
                          <tr
                            key={video.id}
                            className="border-b border-zinc-800/80 last:border-b-0 hover:bg-zinc-800/20 transition-colors"
                          >
                            <td className="px-5 py-4 sm:px-6">
                              <div className="flex min-w-[220px] items-center gap-3">
                                <div className="h-14 w-24 flex-shrink-0 overflow-hidden rounded border border-zinc-800 bg-black">
                                  {video.thumbnail ? (
                                    <img
                                      src={video.thumbnail}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-600">
                                      Sem capa
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <Link
                                    to={`/video/${video.id}`}
                                    className="line-clamp-2 text-sm text-white hover:text-brand-primary transition-colors"
                                  >
                                    {video.title}
                                  </Link>
                                  <p className="mt-1 text-[10px] font-mono text-zinc-600 md:hidden">
                                    {formatDate(video.created_at)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="hidden px-4 py-4 text-sm text-zinc-400 md:table-cell">
                              {formatDate(video.created_at)}
                            </td>
                            <td className="hidden px-4 py-4 text-sm tabular-nums text-zinc-300 sm:table-cell">
                              {(Number(video.views) || 0).toLocaleString('pt-BR')}
                            </td>
                            <td className="hidden px-4 py-4 text-sm tabular-nums text-zinc-300 lg:table-cell">
                              {(video.watchlistCount ?? 0).toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-4">
                              <StatusBadge status={status} />
                            </td>
                            <td className="px-5 py-4 sm:px-6">
                              <div className="flex flex-wrap items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(video)}
                                  className="border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                                >
                                  Editar
                                </button>
                                <Link
                                  to={`/video/${video.id}`}
                                  className="border border-zinc-700 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:border-brand-primary/50 hover:text-brand-primary"
                                >
                                  Ver no Site
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => setVideoToDelete(video)}
                                  className="border border-zinc-800 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 transition-colors hover:border-red-500/40 hover:text-red-400"
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </SiteContainer>
      </AnimatedPage>

      <Transition appear show={isUploadOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeUploadModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <Dialog.Panel className="w-full max-w-2xl rounded-lg border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
                <Dialog.Title className="font-anton text-2xl text-white">
                  {videoToEdit ? 'Editar Caso' : 'Novo Caso'}
                </Dialog.Title>
                <p className="mt-2 text-sm text-zinc-500">
                  {videoToEdit
                    ? 'Atualize capa, metadados ou arquivo do caso.'
                    : 'Envie thumbnail, metadados e vídeo ou cole um link direto.'}
                </p>
                <div className="mt-6">
                  <CreatorUploadForm
                    user={user}
                    profile={profile}
                    onSuccess={handleUploadSuccess}
                    videoToEdit={videoToEdit}
                  />
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={Boolean(videoToDelete)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isDeleting && setVideoToDelete(null)}>
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
              <Dialog.Panel className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-6 sm:p-8">
                <Dialog.Title className="font-anton text-xl text-white">Excluir caso?</Dialog.Title>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  Esta ação remove permanentemente
                  {' '}
                  <span className="text-white">{videoToDelete?.title}</span>
                  {' '}
                  do catálogo.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setVideoToDelete(null)}
                    className="flex-1 rounded-lg border border-zinc-700 px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:text-white disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDeleteConfirm}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                  >
                    {isDeleting ? 'Excluindo…' : 'Confirmar exclusão'}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
