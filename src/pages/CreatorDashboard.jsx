import React, { useState, useEffect, Fragment } from 'react';
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
  countByVideoId,
  estimateInvestigationHours,
  fetchAudiencePatentDistribution,
  fetchTopPerformingVideo,
  countUniqueAudienceFromViews,
  buildPeriodStartIso,
  emptyQueryResult,
} from '../utils/opsAnalytics';
import {
  resolveAvatarUrl,
  resolveBannerUrl,
  isValidRenderableUrl,
  PROFILE_FIELDS_SELECT,
  getAvatarFieldCandidates,
} from '../utils/profileMedia';
import { fetchPartnerFollowerCount } from '../utils/subscriptions';

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
const DeleteIcon = (props) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

function getBannerUrl(profile) {
  return resolveBannerUrl(profile);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [timePeriod, setTimePeriod] = useState(30);

  const [metrics, setMetrics] = useState({
    inquiries: 0,
    supports: 0,
    theories: 0,
    activeHours: 0,
    subscribers: 0,
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
      const resolvedAvatar = resolveAvatarUrl(data);
      console.log('Dados do perfil carregados:', data);
      console.log('[Avatar Debug]', {
        avatar_url: data.avatar_url,
        creatorAvatar: data.creatorAvatar,
        creatoravatar: data.creatoravatar,
        candidatos: getAvatarFieldCandidates(data),
        resolvedAvatar,
        isValid: isValidRenderableUrl(resolvedAvatar),
      });
      setHeaderProfile(data);
    }
    return data;
  };

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

    const viewsMap = countByVideoId(viewsRows);
    const supportsMap = countByVideoId(supportsRows);
    const theoriesMap = countByVideoId(theoriesRows, 'video_id');

    const inquiries = viewsRows.length;
    const supports = supportsRows.length;
    const theories = theoriesRows.length;

    const uniqueAudience = countUniqueAudienceFromViews(viewsRows);
    const followers = await fetchPartnerFollowerCount(supabase, user.id);

    setMetrics({
      inquiries,
      supports,
      theories,
      activeHours: estimateInvestigationHours(inquiries),
      subscribers: uniqueAudience,
      followers,
    });

    setRetentionData(buildRetentionData(videos, viewsMap, theoriesMap, supportsMap));
    setFieldStatus(buildFieldStatus(videos, viewsMap, theoriesMap, supportsMap));

    const topVideoResult = await fetchTopPerformingVideo(
      supabase,
      user.id,
      timePeriod,
      videos,
      viewsMap
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
          inquiries: viewsMap.get(video.id) || 0,
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

  const handleDelete = async (videoId) => {
    if (!window.confirm('Confirmar exclusão do vídeo? Esta ação não pode ser desfeita.')) return;

    const { error } = await supabase.from('videos').delete().eq('id', videoId);
    if (error) {
      onSuccess('error', `Erro: ${error.message}`);
    } else {
      onSuccess('success', 'Vídeo removido com sucesso.');
      fetchMyData();
    }
  };

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
                value={metrics.inquiries.toLocaleString('pt-BR')}
                loading={isLoading}
              />
              <OpsStatCard
                label="Curtidas"
                value={metrics.supports.toLocaleString('pt-BR')}
                loading={isLoading}
              />
              <OpsStatCard
                label="Comentários"
                value={metrics.theories.toLocaleString('pt-BR')}
                loading={isLoading}
              />
              <OpsStatCard
                label="Seguidores"
                value={metrics.followers.toLocaleString('pt-BR')}
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

            <OpsPanel title="Seu Conteúdo">
              {isLoading ? (
                <p className="text-sm text-neutral-400 py-8 text-center">Carregando vídeos...</p>
              ) : myVideos.length > 0 ? (
                <div className="overflow-x-auto -mx-2 px-2">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-mono uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
                        <th className="px-4 py-4">Caso</th>
                        <th className="px-4 py-4 text-center">Views</th>
                        <th className="px-4 py-4 text-center">Curtidas</th>
                        <th className="px-4 py-4 text-center">Comentários</th>
                        <th className="px-4 py-4 hidden md:table-cell">Data</th>
                        <th className="px-4 py-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myVideos.map((video) => (
                        <tr key={video.id} className="border-b border-neutral-800/80 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={video.thumbnail}
                                alt=""
                                className="w-24 h-14 object-cover border border-neutral-800 hidden md:block"
                              />
                              <Link
                                to={`/video/${video.id}`}
                                className="text-sm text-white hover:text-[#eab308] transition-colors"
                              >
                                {video.title}
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center text-white tabular-nums">
                            {video.stats.inquiries}
                          </td>
                          <td className="px-4 py-4 text-center text-white tabular-nums">
                            {video.stats.supports}
                          </td>
                          <td className="px-4 py-4 text-center text-white tabular-nums">
                            {video.stats.theories}
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell text-sm text-neutral-400">
                            {new Date(video.created_at).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-3 justify-center">
                              <button
                                type="button"
                                onClick={() => onEditClick(video)}
                                className="text-neutral-400 hover:text-white transition-colors"
                                title="Editar"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(video.id)}
                                className="text-neutral-400 hover:text-red-400 transition-colors"
                                title="Excluir"
                              >
                                <DeleteIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-neutral-400 py-12 text-center">
                  Nenhum vídeo publicado. Adicione um novo caso ao canal.
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
    </>
  );
}
