import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import {
  checkPartnerFollowStatus,
  fetchPartnerFollowerCount,
  formatFollowerLabel,
  togglePartnerFollow,
} from '../utils/subscriptions';
import usePartnerFollowerRealtime from '../hooks/usePartnerFollowerRealtime';

/** Usa banner_url do banco via resolveBannerUrl — retorna null se URL for inválida ou apontar para pasta. */
function getPartnerBannerUrl(profile) {
  return resolveBannerUrl(profile);
}

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

function SocialIconLink({ href, label, children }) {
  if (!href) return null;

  return (
    <a
      href={href}
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

  if (loading) {
    return (
      <AnimatedPage>
        <SeoHead title="Carregando… | Dark Stream" description={pageDescription} noIndex />
        <div className={`${PAGE_GRADIENT} min-h-[60vh] flex items-center justify-center`}>
          <p className="text-[11px] font-mono uppercase tracking-widest text-neutral-500">
            Carregando canal…
          </p>
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
  const hasShortTab = shortUpdates.length > 0;
  const activeVideos = activeVideoTab === 'shorts' ? shortUpdates : mainCases;

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

          <SiteContainer className="relative -mt-20 sm:-mt-24 md:-mt-28 pb-8">
            <div className="flex flex-col lg:flex-row lg:items-end gap-6 lg:gap-8">
              <img
                src={avatarUrl}
                alt={partnerProfile.username}
                className="w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 rounded-full object-cover border-4 border-black ring-2 ring-dark-border shadow-2xl shadow-black/80 flex-shrink-0"
              />

              <div className="flex-1 min-w-0 pb-1 space-y-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-brand-primary/90 mb-2">
                    Canal do Parceiro
                  </p>
                  <h1 className="font-anton text-4xl sm:text-5xl md:text-6xl text-white tracking-wide leading-none">
                    {partnerProfile.username}
                  </h1>
                </div>

                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                  {formatFollowerLabel(followerCount)}
                </p>

                {partnerProfile.bio && (
                  <p className="max-w-3xl text-sm sm:text-base text-zinc-300 leading-relaxed whitespace-pre-line">
                    {partnerProfile.bio}
                  </p>
                )}

                {(partnerProfile.instagram_url || partnerProfile.x_url) && (
                  <div className="flex items-center gap-3 pt-1">
                    <SocialIconLink href={partnerProfile.instagram_url} label="Instagram">
                      <InstagramIcon className="w-4 h-4" />
                    </SocialIconLink>
                    <SocialIconLink href={partnerProfile.x_url} label="X">
                      <XIcon className="w-4 h-4" />
                    </SocialIconLink>
                  </div>
                )}
              </div>

              {showFollowButton && (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={isProcessingFollow}
                  className="self-start lg:self-end flex-shrink-0 border border-dark-border bg-black/40 backdrop-blur-sm text-white px-5 py-2.5 text-xs font-mono uppercase tracking-wider hover:border-brand-primary hover:text-brand-primary transition-colors disabled:opacity-50"
                >
                  {isProcessingFollow ? '…' : isSubscribed ? 'Seguindo' : 'Seguir'}
                </button>
              )}
            </div>
          </SiteContainer>
        </section>

        <SiteContainer className="pb-16 pt-4">
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-dark-border">
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                <button
                  type="button"
                  onClick={() => setActiveVideoTab('main')}
                  className={`flex-shrink-0 px-4 py-3 text-[11px] font-mono uppercase tracking-widest border-b-2 transition-colors ${
                    activeVideoTab === 'main'
                      ? 'border-brand-primary text-white'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Casos Principais
                  <span className="ml-2 text-zinc-600">{mainCases.length}</span>
                </button>
                {hasShortTab && (
                  <button
                    type="button"
                    onClick={() => setActiveVideoTab('shorts')}
                    className={`flex-shrink-0 px-4 py-3 text-[11px] font-mono uppercase tracking-widest border-b-2 transition-colors ${
                      activeVideoTab === 'shorts'
                        ? 'border-brand-primary text-white'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Atualizações &amp; Shorts
                    <span className="ml-2 text-zinc-600">{shortUpdates.length}</span>
                  </button>
                )}
              </div>

              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-600 pb-3 sm:pb-0">
                {activeVideoTab === 'main'
                  ? 'Investigações longas publicadas'
                  : 'Desdobramentos e flashes do canal'}
              </p>
            </div>

            {activeVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {activeVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    fullWidth
                    variant={activeVideoTab === 'shorts' ? 'short' : 'default'}
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
    </AnimatedPage>
  );
}
