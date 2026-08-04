// src/pages/Explore.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import SkeletonCard from './SkeletonCard';
import CategoryRow from '../components/CategoryRow';
import FeaturedBanner, { pickFeaturedVideo } from '../components/FeaturedBanner';
import SiteContainer from '../components/SiteContainer';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import {
  fetchUserFeedback,
  normalizeFeedbackEntries,
  filterVideosByFeedback,
  buildRecommendedVideos,
} from '../utils/userFeedback';
import { fetchContinueWatching } from '../utils/watchHistory';
import { fetchWatchlist } from '../utils/watchlist';

const DEFAULT_CATEGORIES = [
  'Nacionais', 'Internacionais', 'Não solucionados', 'Solucionados',
  'Serial Killers', 'Documentários', 'Sobrenaturais',
];

export default function Explore({ user: userProp }) {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const user = authUser || userProp;
  const userId = user?.id;

  const [groupedVideos, setGroupedVideos] = useState({});
  const [categories, setCategories] = useState([]);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  const loadUserLibrary = useCallback(async (activeUserId) => {
    if (!activeUserId) {
      setContinueWatching([]);
      setWatchlist([]);
      return;
    }

    const [continueRes, watchlistRes] = await Promise.all([
      fetchContinueWatching(activeUserId),
      fetchWatchlist(activeUserId),
    ]);

    setContinueWatching(continueRes || []);
    setWatchlist(watchlistRes || []);
  }, []);

  useEffect(() => {
    if (authLoading) return undefined;

    loadUserLibrary(userId);

    const handleFocus = () => {
      if (userId) {
        loadUserLibrary(userId);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [authLoading, userId, loadUserLibrary]);

  useEffect(() => {
    const fetchCatalogData = async () => {
      setLoading(true);

      const [categoriesRes, videosRes, feedbackRes] = await Promise.all([
        supabase
          .from('categories')
          .select('name')
          .order('created_at', { ascending: true }),
        supabase
          .from('videos')
          .select('*, creator_id (id, username, "creatorAvatar", role)')
          .eq('is_short', false)
          .is('parent_video_id', null)
          .order('created_at', { ascending: false }),
        userId ? fetchUserFeedback(userId) : Promise.resolve([]),
      ]);

      let categoriesData = [];
      if (categoriesRes.error) {
        console.error('Erro ao buscar categorias:', categoriesRes.error);
        categoriesData = DEFAULT_CATEGORIES.map((name) => ({ name }));
      } else {
        categoriesData = categoriesRes.data?.length
          ? categoriesRes.data
          : DEFAULT_CATEGORIES.map((name) => ({ name }));
      }

      if (videosRes.error) {
        console.error('Erro ao buscar vídeos:', videosRes.error);
        setLoading(false);
        return;
      }

      const regularVideos = videosRes.data || [];
      const videosById = new Map(regularVideos.map((video) => [video.id, video]));
      const feedbackEntries = normalizeFeedbackEntries(feedbackRes, videosById);
      const visibleVideos = filterVideosByFeedback(regularVideos, feedbackEntries);
      const recommended = buildRecommendedVideos(visibleVideos, feedbackEntries, 12);

      const categoryOrder = categoriesData.map((c) => c.name);
      const groups = {};
      categoryOrder.forEach((cat) => { groups[cat] = []; });

      visibleVideos.forEach((video) => {
        const videoCategories = Array.isArray(video.category)
          ? video.category
          : video.category
            ? [video.category]
            : [];

        videoCategories.forEach((cat) => {
          if (groups[cat]) groups[cat].push(video);
        });
      });

      setFeaturedVideo(pickFeaturedVideo(visibleVideos.length ? visibleVideos : regularVideos));
      setRecommendedVideos(recommended);
      setCategories(categoryOrder);
      setGroupedVideos(groups);
      setLoading(false);
    };

    if (!authLoading) {
      fetchCatalogData();
    }
  }, [userId, authLoading]);

  const handleNavigation = (path) => {
    setIsNavigating(true);
    setTimeout(() => { navigate(path); }, 500);
  };

  const hasContent = useMemo(
    () => continueWatching.length > 0
      || watchlist.length > 0
      || recommendedVideos.length > 0
      || categories.some((category) => groupedVideos[category]?.length > 0),
    [continueWatching.length, watchlist.length, recommendedVideos.length, categories, groupedVideos]
  );

  return (
    <AnimatedPage className="w-full">
      <SeoHead
        title="Explorar Casos | Dark Stream"
        description={DEFAULT_SITE_DESCRIPTION}
      />

      <div className={`w-full transition-opacity duration-500 ${isNavigating ? 'opacity-0' : 'opacity-100'}`}>
        {!loading && featuredVideo && (
          <FeaturedBanner featuredVideo={featuredVideo} onNavigate={handleNavigation} user={user} />
        )}

        <div className="pb-12">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <SiteContainer key={i} className="my-8 space-y-4">
                <div className="h-8 w-48 max-w-[40%] animate-pulse rounded-sm bg-dark-panel" />
                <div className="relative w-full overflow-hidden">
                  <div className="flex w-full touch-pan-y gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <SkeletonCard key={j} />
                    ))}
                  </div>
                </div>
              </SiteContainer>
            ))
          ) : (
            <>
              {userId && watchlist.length > 0 && (
                <SiteContainer className="my-8">
                  <CategoryRow
                    title="Sua Lista"
                    videos={watchlist}
                    onNavigate={handleNavigation}
                    linkable={false}
                  />
                </SiteContainer>
              )}

              {userId && continueWatching.length > 0 && (
                <SiteContainer className="my-8">
                  <CategoryRow
                    title="Continuar Assistindo"
                    videos={continueWatching}
                    onNavigate={handleNavigation}
                    linkable={false}
                    showProgressBar
                  />
                </SiteContainer>
              )}

              {recommendedVideos.length > 0 && (
                <SiteContainer className="my-8">
                  <CategoryRow
                    title="Recomendados para Você"
                    videos={recommendedVideos}
                    onNavigate={handleNavigation}
                    linkable={false}
                  />
                </SiteContainer>
              )}

              {categories.map((category) => (
                <SiteContainer key={category} className="my-8">
                  <CategoryRow
                    title={category}
                    videos={groupedVideos[category]}
                    onNavigate={handleNavigation}
                  />
                </SiteContainer>
              ))}

              {!hasContent && (
                <SiteContainer className="my-8">
                  <p className="py-16 text-center font-mono text-sm uppercase tracking-wider text-zinc-500">
                    Nenhum caso disponível no catálogo.
                  </p>
                </SiteContainer>
              )}
            </>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
