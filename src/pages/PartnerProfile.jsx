import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import SiteContainer from '../components/SiteContainer';
import SeoHead, { buildMetaDescription, buildPartnerPageTitle } from '../components/SeoHead';
import {
  fetchPartnerProfileBySlug,
  formatPartnerVideoForCard,
  getPartnerProfilePath,
  resolveAvatarUrl,
  resolveBannerUrl,
} from '../utils/partnerProfile';
import VideoCard from '../components/VideoCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  checkPartnerFollowStatus,
  fetchPartnerFollowerCount,
  formatFollowerLabel,
  togglePartnerFollow,
} from '../utils/subscriptions';
import usePartnerFollowerRealtime from '../hooks/usePartnerFollowerRealtime';
import SupportPartnerModal from '../components/SupportPartnerModal';

/** Usa banner_url do banco via resolveBannerUrl — retorna null se URL for inválida ou apontar para pasta. */
function getPartnerBannerUrl(profile) {
  return resolveBannerUrl(profile);
}

const YoutubeIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const InstagramIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
  </svg>
);

const XIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

function isValidSocialUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  return trimmed.length > 0 && trimmed !== '#';
}

function SocialIconLink({ href, label, children }) {
  if (!isValidSocialUrl(href)) return null;

  return (
    <a
      href={href.trim()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex items-center justify-center w-10 h-10 border border-dark-border bg-black/30 text-zinc-400 hover:text-brand-primary hover:border-zinc-600 transition-colors"
    >
      {children}
    </a>
  );
}

const PAGE_GRADIENT = 'bg-gradient-to-b from-[#000000] via-[#0b0505] to-[#140606]';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Mais Recentes' },
  { value: 'views', label: 'Mais Vistos' },
  { value: 'duration', label: 'Mais Longos' },
];

function getVideoViews(video) {
  return Number(video?.views_count ?? video?.views ?? 0) || 0;
}

function getVideoDurationSeconds(video) {
  const candidates = [video?.duration_seconds, video?.duration, video?.runtime];

  for (const value of candidates) {
    if (typeof value === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(value.trim())) {
      const parts = value.trim().split(':').map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    }

    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }

  return 0;
}

function sortPartnerVideos(videos, sortBy) {
  const list = [...videos];

  switch (sortBy) {
    case 'views':
      return list.sort((a, b) => getVideoViews(b) - getVideoViews(a));
    case 'duration':
      return list.sort((a, b) => getVideoDurationSeconds(b) - getVideoDurationSeconds(a));
    case 'recent':
    default:
      return list.sort(
        (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime(),
      );
  }
}

function PartnerNotFound({ slug }) {
  return (
    <div className={`${PAGE_GRADIENT} min-h-[70vh] flex items-center justify-center px-6 py-16`}>
      <div className="max-w-lg w-full text-center space-y-6 border border-dark-border bg-black/40 backdrop-blur-sm p-8 sm:p-10">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#eab308]/80">
          Canal não localizado
        </p>
        <h1 className="font-anton text-2xl sm:text-3xl text-white">
          Canal não encontrado
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Verifique o link ou tente novamente.
          {slug && (
            <span className="block mt-2 text-neutral-500 font-mono text-xs">
              Referência: {slug}
            </span>
          )}
        </p>
        <Link
          to="/casos"
          className="inline-block bg-[#eab308] text-black font-mono uppercase tracking-wider text-xs px-6 py-3 hover:opacity-90 transition-opacity"
        >
          Voltar para a Home
        </Link>
      </div>
    </div>
  );
}

export default function PartnerProfile({ currentUser }) {
  const { id: legacySlug, username } = useParams();
  const slug = (username || legacySlug || '').trim();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [partnerProfile, setPartnerProfile] = useState(null);
  const [mainCases, setMainCases] = useState([]);
  const [shortUpdates, setShortUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [activeVideoTab, setActiveVideoTab] = useState('main');
  const [sortBy, setSortBy] = useState('recent');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState(null);

  const handleFollowerCountUpdate = useCallback((count) => {
    setFollowerCount(count);
  }, []);

  usePartnerFollowerRealtime(
    supabase,
    partnerProfile?.id,
    handleFollowerCountUpdate
  );

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    const fetchPartnerData = async () => {
      setLoading(true);
      setNotFound(false);
      setFetchError(null);
      setPartnerProfile(null);
      setMainCases([]);
      setShortUpdates([]);
      setBannerFailed(false);

      const { data: profileData, error: profileError } = await fetchPartnerProfileBySlug(supabase, slug);

      if (cancelled) return;

      if (profileError) {
        console.error('Erro ao buscar perfil do parceiro:', profileError);
        setFetchError(profileError.message || 'Não foi possível carregar o canal.');
        setMainCases([]);
        setShortUpdates([]);
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.warn(`Perfil do parceiro não encontrado para o slug: "${slug}"`);
        setNotFound(true);
        setMainCases([]);
        setShortUpdates([]);
        setLoading(false);
        return;
      }

      setPartnerProfile(profileData);

      const videoSelectWithDuration =
        'id, title, thumbnail, views, created_at, duration, is_short, parent_video_id, short_type';
      const videoSelectBase = 'id, title, thumbnail, views, created_at, is_short, parent_video_id, short_type';

      const fetchVideos = async (filters) => {
        let result = await supabase
          .from('videos')
          .select(videoSelectWithDuration)
          .eq('creator_id', profileData.id)
          .order('created_at', { ascending: false });

        if (result.error) {
          result = await supabase
            .from('videos')
            .select(videoSelectBase)
            .eq('creator_id', profileData.id)
            .order('created_at', { ascending: false });
        }

        if (result.error) return { data: [], error: result.error };

        let rows = result.data || [];
        if (filters === 'main') {
          rows = rows.filter((video) => !video.is_short && !video.parent_video_id);
        } else if (filters === 'shorts') {
          rows = rows.filter((video) => video.is_short);
        }

        return {
          data: rows.map((video) => formatPartnerVideoForCard(video, profileData)),
          error: null,
        };
      };

      const [mainResult, shortsResult] = await Promise.all([
        fetchVideos('main'),
        fetchVideos('shorts'),
      ]);

      if (cancelled) return;

      if (mainResult.error || shortsResult.error) {
        console.error('Erro ao buscar vídeos do parceiro:', mainResult.error || shortsResult.error);
        setMainCases([]);
        setShortUpdates([]);
      } else {
        setMainCases(mainResult.data);
        setShortUpdates(shortsResult.data);
        setActiveVideoTab(mainResult.data.length > 0 ? 'main' : 'shorts');
      }

      const userId = currentUser?.id;
      if (!cancelled) {
        try {
          if (userId && userId !== profileData.id) {
            const following = await checkPartnerFollowStatus(supabase, userId, profileData.id);
            setIsSubscribed(following);
          } else {
            setIsSubscribed(false);
          }
        } catch {
          setIsSubscribed(false);
        }

        try {
          const count = await fetchPartnerFollowerCount(supabase, profileData.id);
          if (!cancelled) setFollowerCount(count);
        } catch {
          if (!cancelled) setFollowerCount(0);
        }
      }

      setLoading(false);
    };

    fetchPartnerData();

    return () => {
      cancelled = true;
    };
  }, [slug, currentUser?.id]);

  useEffect(() => {
    const supportStatus = searchParams.get('support');
    if (supportStatus === 'success') {
      setSupportMessage('Apoio registrado com sucesso! O selo Detetive Apoiador já está ativo.');
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('support');
      setSearchParams(nextParams, { replace: true });
    } else if (supportStatus === 'canceled') {
      setSupportMessage(null);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('support');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleOpenSupportModal = () => {
    if (!currentUser) {
      navigate('/login', {
        state: {
          from: getPartnerProfilePath(partnerProfile) || `/parceiros/${slug}`,
        },
      });
      return;
    }
    setIsSupportModalOpen(true);
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate('/login', {
        state: {
          from: getPartnerProfilePath(partnerProfile) || `/parceiros/${slug}`,
        },
      });
      return;
    }
    if (currentUser.id === partnerProfile?.id) return;

    setIsProcessingFollow(true);

    try {
      const nextFollowing = await togglePartnerFollow(
        supabase,
        currentUser.id,
        partnerProfile.id,
        isSubscribed
      );
      setIsSubscribed(nextFollowing);

      const updatedCount = await fetchPartnerFollowerCount(supabase, partnerProfile.id);
      setFollowerCount(updatedCount);
    } catch {
      setIsSubscribed(false);
    } finally {
      setIsProcessingFollow(false);
    }
  };

  const pageTitle = partnerProfile
    ? buildPartnerPageTitle(partnerProfile.username)
    : 'Parceiro | Dark Stream';

  const pageDescription = partnerProfile?.bio
    ? buildMetaDescription(partnerProfile.bio)
    : 'Canal de parceiro verificado na plataforma Dark Stream.';

  const activeVideos = activeVideoTab === 'shorts' ? shortUpdates : mainCases;
  const sortedActiveVideos = useMemo(
    () => sortPartnerVideos(activeVideos, sortBy),
    [activeVideos, sortBy],
  );

  if (loading) {
    return (
      <AnimatedPage>
        <SeoHead title="Carregando… | Dark Stream" description={pageDescription} noIndex />
        <div className={`${PAGE_GRADIENT} min-h-[60vh] flex items-center justify-center`}>
          <LoadingSpinner size="md" label="Carregando canal…" />
        </div>
      </AnimatedPage>
    );
  }

  if (fetchError) {
    return (
      <AnimatedPage>
        <SeoHead title="Erro ao carregar canal | Dark Stream" noIndex />
        <div className={`${PAGE_GRADIENT} min-h-[70vh] flex items-center justify-center px-6 py-16`}>
          <div className="max-w-lg w-full text-center space-y-6 border border-dark-border bg-black/40 backdrop-blur-sm p-8 sm:p-10">
            <h1 className="font-anton text-2xl text-white">Erro ao carregar o canal</h1>
            <p className="text-sm text-neutral-400">{fetchError}</p>
            <Link
              to="/casos"
              className="inline-block bg-[#eab308] text-black font-mono uppercase tracking-wider text-xs px-6 py-3 hover:opacity-90 transition-opacity"
            >
              Voltar para a Home
            </Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (notFound || !partnerProfile) {
    return (
      <AnimatedPage>
        <SeoHead title="Canal não encontrado | Dark Stream" noIndex />
        <PartnerNotFound slug={slug} />
      </AnimatedPage>
    );
  }

  // Guard extra — nunca renderiza layout sem perfil válido
  if (!partnerProfile.id || !partnerProfile.username) {
    return (
      <AnimatedPage>
        <SeoHead title="Canal não encontrado | Dark Stream" noIndex />
        <PartnerNotFound slug={slug} />
      </AnimatedPage>
    );
  }

  const avatarUrl =
    resolveAvatarUrl(partnerProfile) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(partnerProfile.username?.charAt(0) || 'P')}&background=121212&color=eab308&bold=true`;

  const bannerUrl = getPartnerBannerUrl(partnerProfile);
  const showBannerImage = Boolean(bannerUrl) && !bannerFailed;

  const showFollowButton = currentUser && currentUser.id !== partnerProfile.id;
  const showSupportButton = currentUser && currentUser.id !== partnerProfile.id;
  const partnerReturnPath = getPartnerProfilePath(partnerProfile) || `/parceiros/${slug}`;
  const hasShortTab = shortUpdates.length > 0;

  return (
    <AnimatedPage>
      <SeoHead
        title={pageTitle}
        description={pageDescription}
        image={bannerUrl || avatarUrl}
        type="profile"
      />

      <div className={`relative min-h-screen text-white ${PAGE_GRADIENT}`}>
        {/* Hero full bleed — sobe por trás do header sticky (h-16) */}
        <section className="relative -mt-16 pt-16">
          <div className="relative h-[min(52vh,32rem)] min-h-[18rem] sm:min-h-[22rem] overflow-hidden">
            {showBannerImage ? (
              <img
                src={bannerUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                onError={() => setBannerFailed(true)}
              />
            ) : (
              <div className={`absolute inset-0 ${PAGE_GRADIENT}`} aria-hidden="true" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#140606] via-black/70 to-black/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/45" />
          </div>

          <SiteContainer className="relative -mt-14 sm:-mt-16 md:-mt-20 pb-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
              <img
                src={avatarUrl}
                alt={partnerProfile.username}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-zinc-800 object-cover flex-shrink-0 shadow-xl shadow-black/60"
              />

              <div className="flex flex-1 min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-primary/90">
                    Canal do Parceiro
                  </p>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                    {partnerProfile.username}
                  </h1>

                  <p className="text-xs text-amber-500 font-mono">
                    {formatFollowerLabel(followerCount)}
                  </p>

                  {partnerProfile.bio && (
                    <p className="max-w-2xl pt-2 text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                      {partnerProfile.bio}
                    </p>
                  )}

                  {(isValidSocialUrl(partnerProfile.youtube_url)
                    || isValidSocialUrl(partnerProfile.instagram_url)
                    || isValidSocialUrl(partnerProfile.x_url)
                    || isValidSocialUrl(partnerProfile.twitter_url)) && (
                    <div className="flex items-center gap-3 pt-2">
                      {isValidSocialUrl(partnerProfile.youtube_url) && (
                        <a
                          href={partnerProfile.youtube_url.trim()}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="YouTube"
                          className="rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 text-zinc-400 transition-all hover:border-red-500 hover:text-red-500"
                        >
                          <YoutubeIcon className="h-5 w-5" />
                        </a>
                      )}
                      {isValidSocialUrl(partnerProfile.instagram_url) && (
                        <SocialIconLink href={partnerProfile.instagram_url} label="Instagram">
                          <InstagramIcon className="w-4 h-4" />
                        </SocialIconLink>
                      )}
                      {(isValidSocialUrl(partnerProfile.x_url) || isValidSocialUrl(partnerProfile.twitter_url)) && (
                        <SocialIconLink
                          href={partnerProfile.x_url || partnerProfile.twitter_url}
                          label="X"
                        >
                          <XIcon className="w-4 h-4" />
                        </SocialIconLink>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 self-start flex-shrink-0">
                  {showSupportButton && (
                    <button
                      type="button"
                      onClick={handleOpenSupportModal}
                      className="rounded-none bg-amber-500 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-amber-400"
                    >
                      Apoiar este Investigador
                    </button>
                  )}
                  {showFollowButton && (
                    <button
                      type="button"
                      onClick={handleFollowToggle}
                      disabled={isProcessingFollow}
                      className="border border-dark-border bg-black/40 backdrop-blur-sm text-white px-5 py-2.5 text-xs font-mono uppercase tracking-wider hover:border-brand-primary hover:text-brand-primary transition-colors disabled:opacity-50"
                    >
                      {isProcessingFollow ? '…' : isSubscribed ? 'Seguindo' : 'Seguir'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {supportMessage && (
              <p className="mt-4 border border-amber-500/30 bg-amber-500/10 px-4 py-3 font-mono text-xs uppercase tracking-wider text-amber-500">
                {supportMessage}
              </p>
            )}
          </SiteContainer>
        </section>

        <SiteContainer className="pb-16 pt-4">
          <div className="space-y-8">
            <div className="flex flex-col gap-4 border-b border-dark-border sm:flex-row sm:items-end sm:justify-between">
              <div className="flex touch-pan-y gap-1 overflow-x-auto scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setActiveVideoTab('main')}
                  className={`flex-shrink-0 border-b-2 px-4 py-3 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                    activeVideoTab === 'main'
                      ? 'border-brand-primary text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Casos Publicados
                  <span className="ml-2 font-mono text-xs text-amber-500">{mainCases.length}</span>
                </button>
                {hasShortTab && (
                  <button
                    type="button"
                    onClick={() => setActiveVideoTab('shorts')}
                    className={`flex-shrink-0 border-b-2 px-4 py-3 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                      activeVideoTab === 'shorts'
                        ? 'border-brand-primary text-white'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Atualizações &amp; Shorts
                    <span className="ml-2 font-mono text-xs text-amber-500">{shortUpdates.length}</span>
                  </button>
                )}
              </div>

              {activeVideos.length > 0 && (
                <div className="flex items-center pb-3 sm:pb-0">
                  <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-amber-500/80">
                    Ordenar por:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    aria-label="Ordenar vídeos"
                    className="cursor-pointer rounded-none border border-zinc-700/80 bg-zinc-900 px-3 py-1.5 font-mono text-xs font-bold uppercase text-zinc-200 transition-colors hover:border-amber-500/80 focus:border-amber-500/80 focus:outline-none"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-zinc-900">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {activeVideos.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {sortedActiveVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    fullWidth
                    variant="default"
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm font-mono text-zinc-600 py-12 text-center uppercase tracking-wider border border-dark-border bg-black/20">
                {activeVideoTab === 'main'
                  ? 'Nenhum caso principal publicado ainda.'
                  : 'Nenhuma atualização ou short publicado ainda.'}
              </p>
            )}
          </div>
        </SiteContainer>
      </div>

      <SupportPartnerModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        partner={partnerProfile}
        currentUser={currentUser}
        returnPath={partnerReturnPath}
        onSuccess={() => {
          setSupportMessage('Apoio registrado! O selo Detetive Apoiador já está ativo.');
          setIsSupportModalOpen(false);
        }}
      />
    </AnimatedPage>
  );
}
