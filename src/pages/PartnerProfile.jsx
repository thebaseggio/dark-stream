import React, { useState, useEffect } from 'react';
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
      className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-neutral-800 bg-[#121212] text-neutral-400 hover:text-[#eab308] hover:border-neutral-600 transition-colors"
    >
      {children}
    </a>
  );
}

function PartnerNotFound({ slug }) {
  return (
    <div className="bg-black min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center space-y-6 border border-neutral-800 bg-[#121212] p-8 sm:p-10">
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
  const [partnerVideos, setPartnerVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [bannerFailed, setBannerFailed] = useState(false);

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
      setPartnerVideos([]);
      setBannerFailed(false);

      const { data: profileData, error: profileError } = await fetchPartnerProfileBySlug(supabase, slug);

      if (cancelled) return;

      if (profileError) {
        console.error('Erro ao buscar perfil do parceiro:', profileError);
        setFetchError(profileError.message || 'Não foi possível carregar o canal.');
        setPartnerVideos([]);
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.warn(`Perfil do parceiro não encontrado para o slug: "${slug}"`);
        setNotFound(true);
        setPartnerVideos([]);
        setLoading(false);
        return;
      }

      setPartnerProfile(profileData);

      const videoSelectWithDuration =
        'id, title, thumbnail, views, created_at, duration, is_short';
      const videoSelectBase = 'id, title, thumbnail, views, created_at, is_short';

      let videosResult = await supabase
        .from('videos')
        .select(videoSelectWithDuration)
        .eq('creator_id', profileData.id)
        .eq('is_short', false)
        .order('created_at', { ascending: false });

      if (videosResult.error) {
        videosResult = await supabase
          .from('videos')
          .select(videoSelectBase)
          .eq('creator_id', profileData.id)
          .eq('is_short', false)
          .order('created_at', { ascending: false });
      }

      const { data: videosData, error: videosError } = videosResult;

      if (cancelled) return;

      if (videosError) {
        console.error('Erro ao buscar vídeos do parceiro:', videosError);
        setPartnerVideos([]);
      } else {
        setPartnerVideos(
          (videosData || []).map((video) => formatPartnerVideoForCard(video, profileData))
        );
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
        <div className="bg-black min-h-[60vh] flex items-center justify-center">
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
        <div className="bg-black min-h-[70vh] flex items-center justify-center px-6 py-16">
          <div className="max-w-lg w-full text-center space-y-6 border border-neutral-800 bg-[#121212] p-8 sm:p-10">
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

  return (
    <AnimatedPage>
      <SeoHead
        title={pageTitle}
        description={pageDescription}
        image={bannerUrl || avatarUrl}
        type="profile"
      />

      <div className="bg-black text-white min-h-screen">
        <section className="relative w-full">
          <div className="relative h-52 sm:h-64 md:h-72 lg:h-80 overflow-hidden bg-[#121212]">
            {showBannerImage ? (
              <img
                src={bannerUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                onError={() => setBannerFailed(true)}
              />
            ) : (
              <div className="absolute inset-0 bg-[#121212]" aria-hidden="true" />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
          </div>

          <SiteContainer className="relative -mt-16 sm:-mt-20 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-6">
              <img
                src={avatarUrl}
                alt={partnerProfile.username}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-black ring-2 ring-neutral-800 shadow-2xl shadow-black/80 flex-shrink-0"
              />

              <div className="flex-1 min-w-0 pb-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#eab308]/80 mb-1">
                  Canal do Parceiro
                </p>
                <h1 className="font-anton text-3xl sm:text-4xl md:text-5xl text-white tracking-wide truncate">
                  {partnerProfile.username}
                </h1>
                <p className="text-[11px] font-mono uppercase tracking-wider text-neutral-500 mt-2">
                  {formatFollowerLabel(followerCount)}
                </p>

                {(partnerProfile.instagram_url || partnerProfile.x_url) && (
                  <div className="flex items-center gap-3 mt-3">
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
                  className="self-start sm:self-end flex-shrink-0 border border-neutral-800 bg-[#121212] text-white px-5 py-2.5 text-xs font-mono uppercase tracking-wider hover:border-[#eab308] hover:text-[#eab308] transition-colors disabled:opacity-50"
                >
                  {isProcessingFollow ? '…' : isSubscribed ? 'Seguindo' : 'Seguir'}
                </button>
              )}
            </div>

            {partnerProfile.bio && (
              <p className="mt-6 max-w-3xl text-sm sm:text-base text-neutral-300 leading-relaxed whitespace-pre-line">
                {partnerProfile.bio}
              </p>
            )}
          </SiteContainer>
        </section>

        <SiteContainer className="pb-16 pt-4">
          <div className="border-t border-neutral-800 pt-10">
            <h2 className="font-anton text-2xl sm:text-3xl text-white mb-8">
              Casos Publicados
            </h2>

            {partnerVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {partnerVideos.map((video) => (
                  <VideoCard key={video.id} video={video} fullWidth />
                ))}
              </div>
            ) : (
              <p className="text-sm font-mono text-neutral-600 py-12 text-center uppercase tracking-wider">
                Nenhum caso publicado ainda.
              </p>
            )}
          </div>
        </SiteContainer>
      </div>
    </AnimatedPage>
  );
}
