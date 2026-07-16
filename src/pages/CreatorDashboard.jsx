import React, { useState, useEffect, Fragment, useMemo, useCallback } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';
import AnimatedPage from '../AnimatedPage';
import { Dialog, Transition } from '@headlessui/react';
import ProfileEditor from '../components/ProfileEditor';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';
import { OpsPanel, OpsStatCard, PeriodSelector } from '../components/ops/OpsPanel';
import InquiryRetentionBars from '../components/ops/InquiryRetentionBars';
import FieldStatusList from '../components/ops/FieldStatusList';
import PatentDistribution from '../components/ops/PatentDistribution';
import {
  buildFieldStatus,
  buildRetentionData,
  buildLifetimeViewsMap,
  countByVideoId,
  fetchAudiencePatentDistribution,
  fetchTopPerformingVideo,
  buildPeriodStartIso,
  emptyQueryResult,
} from '../utils/opsInsights';
import {
  resolveAvatarUrl,
  resolveBannerUrl,
  isValidRenderableUrl,
  PROFILE_FIELDS_SELECT,
} from '../utils/profileMedia';
import { fetchPartnerFollowerCount } from '../utils/subscriptions';
import usePartnerFollowerRealtime from '../hooks/usePartnerFollowerRealtime';
import { fetchPartnerLifetimeStats } from '../utils/partnerStats';

function DashboardAvatar({ profile, className }) {
  const avatarUrl = resolveAvatarUrl(profile);
  const hasValidAvatar = Boolean(avatarUrl) && isValidRenderableUrl(avatarUrl);
  const fallback = `https://ui-avatars.com/api/?name=${profile?.username?.charAt(0) || 'P'}&background=121212&color=eab308`;
  const [useFallback, setUseFallback] = useState(!hasValidAvatar);

  useEffect(() => {
    setUseFallback(!hasValidAvatar);
  }, [hasValidAvatar, avatarUrl]);

  if (!hasValidAvatar || useFallback) {
    return (
      <img
        src={fallback}
        alt={profile?.username || 'Avatar'}
        className={className}
      />
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={profile?.username || 'Avatar'}
      className={className}
      onError={() => {
        console.warn('[Avatar Debug] Falha ao carregar imagem:', avatarUrl);
        setUseFallback(true);
      }}
    />
  );
}

const EditIcon = (props) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
  </svg>
);

function getBannerUrl(profile) {
  return resolveBannerUrl(profile);
}

function getContentTypeLabel(video) {
  if (!video?.is_short) return 'Caso';
  if (video.short_type === 'intro') return 'Prévia';
  if (video.short_type === 'flash') return 'Flash';
  return 'Short';
}

function formatVideoDate(dateValue) {
  if (!dateValue) return '—';
  return new Date(dateValue).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function CreatorDashboard({
  user,
  profile,
  onUploadClick,
  onEditClick,
  onProfileUpdate,
  onSuccess,
}) {
  const [myVideos, setMyVideos] = useState([]);
  const [managedVideos, setManagedVideos] = useState([]);
  const [contentFilter, setContentFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [isDeletingVideo, setIsDeletingVideo] = useState(false);
  const [timePeriod, setTimePeriod] = useState(30);

  const [metrics, setMetrics] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    followers: 0,
  });
  const [retentionData, setRetentionData] = useState([]);
  const [fieldStatus, setFieldStatus] = useState([]);
  const [patentDistribution, setPatentDistribution] = useState({});
  const [topVideo, setTopVideo] = useState(null);
  const [headerProfile, setHeaderProfile] = useState(profile);

  const fetchHeaderProfile = async () => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select(PROFILE_FIELDS_SELECT)
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil do painel:', error);
      return null;
    }

    if (data) {
      setHeaderProfile(data);
    }
    return data;
  };

  const handleFollowerCountUpdate = useCallback((count) => {
    setMetrics((prev) => ({ ...prev, followers: count }));
  }, []);

  usePartnerFollowerRealtime(supabase, user?.id, handleFollowerCountUpdate);

  useEffect(() => {
    if (profile) setHeaderProfile(profile);
  }, [profile]);

  useEffect(() => {
    fetchHeaderProfile();
  }, [user?.id]);

  const refreshHeaderProfile = async (patch) => {
    if (patch) {
      setHeaderProfile((prev) => ({ ...prev, ...patch }));
    }
    await fetchHeaderProfile();
    if (onProfileUpdate) {
      await onProfileUpdate();
    }
  };

  const bannerUrl = getBannerUrl(headerProfile);
  const hasValidBanner = isValidRenderableUrl(bannerUrl);

  const fetchMyData = async () => {
    if (!user) return;
    setIsLoading(true);

    const startDateIso = buildPeriodStartIso(timePeriod);

    const { data: videosData, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('creator_id', user.id)
      .eq('is_short', false);

    if (videosError) {
      console.error(videosError);
      setIsLoading(false);
      return;
    }

    const videos = videosData || [];
    const videoIds = videos.map((v) => v.id);
    const videoIdStrings = videoIds.map(String);
    const hasVideos = videoIds.length > 0;

    let viewsQuery = hasVideos
      ? supabase.from('views').select('id, video_id, user_id').in('video_id', videoIds)
      : null;
    let supportsQuery = hasVideos
      ? supabase
          .from('user_feedback')
          .select('id, video_id')
          .in('video_id', videoIds)
          .eq('rating', 'like')
      : null;
    let theoriesQuery = hasVideos
      ? supabase
          .from('case_theories')
          .select('id, video_id')
          .in('video_id', videoIdStrings)
      : null;

    if (startDateIso) {
      if (viewsQuery) viewsQuery = viewsQuery.gte('created_at', startDateIso);
      if (supportsQuery) supportsQuery = supportsQuery.gte('created_at', startDateIso);
      if (theoriesQuery) theoriesQuery = theoriesQuery.gte('created_at', startDateIso);
    }

    const [viewsRes, supportsRes, theoriesRes] = await Promise.all([
      hasVideos ? viewsQuery : Promise.resolve(emptyQueryResult()),
      hasVideos ? supportsQuery : Promise.resolve(emptyQueryResult()),
      hasVideos ? theoriesQuery : Promise.resolve(emptyQueryResult()),
    ]);

    const viewsRows = viewsRes.data || [];
    const supportsRows = supportsRes.data || [];
    const theoriesRows = theoriesRes.data || [];

    const supportsMap = countByVideoId(supportsRows);
    const theoriesMap = countByVideoId(theoriesRows, 'video_id');
    const lifetimeViewsMap = buildLifetimeViewsMap(videos);

    const [lifetimeMetrics, allVideosRes, followers] = await Promise.all([
      fetchPartnerLifetimeStats(supabase, user.id),
      supabase
        .from('videos')
        .select('id, title, thumbnail, views, created_at, is_short, short_type, parent_video_id')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false }),
      fetchPartnerFollowerCount(supabase, user.id),
    ]);

    setMetrics({
      totalViews: lifetimeMetrics.totalViews,
      totalLikes: lifetimeMetrics.totalLikes,
      totalComments: lifetimeMetrics.totalComments,
      followers,
    });

    setManagedVideos(allVideosRes.data || []);

    setRetentionData(buildRetentionData(videos, lifetimeViewsMap, theoriesMap, supportsMap));
    setFieldStatus(buildFieldStatus(videos, lifetimeViewsMap, theoriesMap, supportsMap));

    const topVideoResult = await fetchTopPerformingVideo(
      supabase,
      user.id,
      timePeriod,
      videos,
      lifetimeViewsMap
    );
    setTopVideo(topVideoResult);

    const viewerIds = viewsRows.map((row) => row.user_id).filter(Boolean);
    const distribution = await fetchAudiencePatentDistribution(supabase, viewerIds);
    setPatentDistribution(distribution);

    const enrichedVideos = videos
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((video) => ({
        ...video,
        stats: {
          inquiries: lifetimeViewsMap.get(video.id) || 0,
          supports: supportsMap.get(video.id) || 0,
          theories: theoriesMap.get(String(video.id)) || 0,
        },
      }));

    setMyVideos(enrichedVideos);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMyData();
  }, [user, timePeriod]);

  const handleDeleteRequest = (video) => {
    setVideoToDelete(video);
  };

  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;

    setIsDeletingVideo(true);

    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoToDelete.id)
      .eq('creator_id', user.id);

    if (error) {
      onSuccess('error', `Erro: ${error.message}`);
    } else {
      onSuccess('success', 'Vídeo removido com sucesso.');
      setVideoToDelete(null);
      fetchMyData();
    }

    setIsDeletingVideo(false);
  };

  const filteredManagedVideos = useMemo(() => {
    if (contentFilter === 'cases') {
      return managedVideos.filter((video) => !video.is_short);
    }
    if (contentFilter === 'shorts') {
      return managedVideos.filter((video) => video.is_short);
    }
    return managedVideos;
  }, [managedVideos, contentFilter]);

  if (!user) {
    return (
      <AnimatedPage>
        <div className="text-center p-8 bg-black text-neutral-400">
          Acesso negado
        </div>
      </AnimatedPage>
    );
  }

  const periodLabel = timePeriod > 0 ? `${timePeriod} dias` : 'Todo o período';

  return (
    <>
      <SeoHead
        title="Painel do Parceiro | Dark Stream"
        description={DEFAULT_SITE_DESCRIPTION}
      />
      <AnimatedPage>
        <div className="bg-black min-h-screen -mx-6 md:-mx-12 px-6 md:px-12 py-8 md:py-10">
          <div className="max-w-[1440px] mx-auto w-full space-y-8 md:space-y-10">
            <header
              className="relative border border-neutral-800 overflow-hidden"
              style={
                hasValidBanner
                  ? {
                      backgroundImage: `url("${bannerUrl}")`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundColor: '#121212',
                    }
                  : { backgroundColor: '#121212' }
              }
            >
              {hasValidBanner && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/40 pointer-events-none"
                  aria-hidden="true"
                />
              )}
              <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between p-6 md:p-8">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center flex-1 min-w-0 w-full">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    className="relative group/avatar flex-shrink-0"
                    title="Editar perfil"
                  >
                    <DashboardAvatar
                      profile={headerProfile}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-zinc-700 shadow-xl bg-[#121212]"
                    />
                    <span className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar:bg-black/30 transition-colors" />
                  </button>

                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#eab308]">
                      Painel do Parceiro
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="font-anton text-2xl sm:text-3xl md:text-4xl text-white tracking-wide">
                        {headerProfile?.username || 'Parceiro'}
                      </h1>
                      <button
                        type="button"
                        onClick={() => setIsProfileModalOpen(true)}
                        className="text-neutral-400 hover:text-white transition-colors"
                        title="Editar perfil"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="max-w-2xl text-zinc-400 text-sm md:text-base leading-relaxed">
                      {headerProfile?.bio || 'Acompanhe o desempenho do seu canal em tempo real.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onUploadClick}
                  className="w-full md:w-auto md:self-center flex-shrink-0 bg-[#eab308] text-black font-mono uppercase tracking-wider text-xs px-6 py-3 hover:opacity-90 transition-opacity"
                >
                  + Novo Vídeo
                </button>
              </div>
            </header>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="font-anton text-xl text-white">
                Visão Geral
                <span className="block text-sm font-sans text-neutral-400 mt-1 font-normal">
                  {periodLabel}
                </span>
              </h2>
              <PeriodSelector timePeriod={timePeriod} onChange={setTimePeriod} />
            </div>

            {topVideo && (
              <OpsPanel title="Vídeo em Destaque">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-3">
                    <Link
                      to={`/video/${topVideo.id}`}
                      className="text-lg text-white hover:text-[#eab308] transition-colors block"
                    >
                      {topVideo.title}
                    </Link>
                    <p className="text-4xl font-anton text-white tabular-nums">
                      {(topVideo.recent_views_count || 0).toLocaleString('pt-BR')}
                      <span className="text-base font-sans text-neutral-400 ml-3">visualizações</span>
                    </p>
                  </div>
                  <div className="md:col-span-4 flex justify-center md:justify-end">
                    <img
                      src={topVideo.thumbnail}
                      alt={topVideo.title}
                      className="w-full max-w-xs md:w-52 aspect-video object-cover border border-neutral-800"
                    />
                  </div>
                </div>
              </OpsPanel>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
              <OpsStatCard
                label="Visualizações"
                value={metrics.totalViews.toLocaleString('pt-BR')}
                hint="Total acumulado"
                loading={isLoading}
              />
              <OpsStatCard
                label="Curtidas"
                value={metrics.totalLikes.toLocaleString('pt-BR')}
                hint="Total acumulado"
                loading={isLoading}
              />
              <OpsStatCard
                label="Comentários"
                value={metrics.totalComments.toLocaleString('pt-BR')}
                hint="Total acumulado"
                loading={isLoading}
              />
              <OpsStatCard
                label="Seguidores"
                value={metrics.followers.toLocaleString('pt-BR')}
                hint="Ao vivo"
                loading={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-5">
              <InquiryRetentionBars data={retentionData} loading={isLoading} />
              <PatentDistribution distribution={patentDistribution} loading={isLoading} />
              <div className="xl:col-span-2 2xl:col-span-1">
                <FieldStatusList cases={fieldStatus} loading={isLoading} />
              </div>
            </div>

            <OpsPanel title="QG de Produções">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <p className="text-sm text-neutral-400 max-w-2xl">
                  Gerencie casos longos e shorts de atualização publicados no seu canal.
                </p>
                <div className="inline-flex border border-neutral-800 bg-black">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'cases', label: 'Casos' },
                    { value: 'shorts', label: 'Shorts' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setContentFilter(option.value)}
                      className={`px-4 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors border-r border-neutral-800 last:border-r-0 ${
                        contentFilter === option.value
                          ? 'bg-[#8e44ad] text-[#f1c40f]'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <p className="text-sm text-neutral-400 py-8 text-center">Carregando produções...</p>
              ) : filteredManagedVideos.length > 0 ? (
                <div className="space-y-3">
                  {filteredManagedVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex flex-col md:flex-row md:items-center gap-4 border border-neutral-800 bg-black/40 hover:border-neutral-700 transition-colors p-4"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`flex-shrink-0 overflow-hidden border border-neutral-800 ${video.is_short ? 'w-16 h-24' : 'w-28 h-16'}`}>
                          <img
                            src={video.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span className="text-[9px] font-mono uppercase tracking-widest text-[#f1c40f] border border-[#8e44ad]/40 bg-[#8e44ad]/10 px-2 py-0.5">
                              {getContentTypeLabel(video)}
                            </span>
                            <span className="text-[10px] font-mono text-neutral-600">
                              {formatVideoDate(video.created_at)}
                            </span>
                          </div>
                          <Link
                            to={`/video/${video.id}`}
                            className="text-sm md:text-base text-white hover:text-[#eab308] transition-colors line-clamp-2"
                          >
                            {video.title}
                          </Link>
                          <p className="text-[11px] font-mono text-neutral-500 mt-1">
                            {(Number(video.views) || 0).toLocaleString('pt-BR')} visualizações
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 md:flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onEditClick(video)}
                          className="flex-1 md:flex-none border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 px-4 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors"
                        >
                          Editar dados
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRequest(video)}
                          className="flex-1 md:flex-none border border-neutral-800 text-neutral-400 hover:text-red-400 hover:border-red-400/40 px-4 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-400 py-12 text-center">
                  Nenhuma produção nesta categoria. Publique um novo caso ou short de atualização.
                </p>
              )}
            </OpsPanel>
          </div>
        </div>
      </AnimatedPage>

      <Transition appear show={isProfileModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsProfileModalOpen(false)}>
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
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <Dialog.Panel className="w-full max-w-5xl border border-neutral-800 bg-[#121212] p-6 sm:p-8 md:p-10">
                <Dialog.Title as="h3" className="font-anton text-2xl text-white mb-2">
                  Editar Perfil
                </Dialog.Title>
                <p className="text-sm text-neutral-400 mb-8">
                  Atualize a identidade visual e as informações do seu canal.
                </p>
                <ProfileEditor
                  user={user}
                  profile={headerProfile || profile}
                  onSuccess={onSuccess}
                  onUploadSuccess={refreshHeaderProfile}
                  onSaveComplete={async (updatedProfile) => {
                    if (updatedProfile) {
                      setHeaderProfile(updatedProfile);
                    }
                    await onProfileUpdate?.();
                    setIsProfileModalOpen(false);
                  }}
                  mode="partner"
                />
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      <Transition appear show={Boolean(videoToDelete)} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isDeletingVideo && setVideoToDelete(null)}>
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
              <Dialog.Panel className="w-full max-w-md border border-neutral-800 bg-[#121212] p-6 sm:p-8">
                <Dialog.Title as="h3" className="font-anton text-xl text-white">
                  Excluir produção?
                </Dialog.Title>
                <p className="text-sm text-neutral-400 mt-3 leading-relaxed">
                  Esta ação remove permanentemente
                  {' '}
                  <span className="text-white">{videoToDelete?.title}</span>
                  {' '}
                  do catálogo. Não pode ser desfeita.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-8">
                  <button
                    type="button"
                    disabled={isDeletingVideo}
                    onClick={() => setVideoToDelete(null)}
                    className="flex-1 border border-neutral-700 text-neutral-300 hover:text-white px-4 py-3 text-[10px] font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingVideo}
                    onClick={handleDeleteConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white px-4 py-3 text-[10px] font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {isDeletingVideo ? 'Excluindo…' : 'Confirmar exclusão'}
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
