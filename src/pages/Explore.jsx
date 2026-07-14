// src/pages/Explore.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import SkeletonCard from './SkeletonCard';
import CategoryRow from '../components/CategoryRow';
import FeaturedBanner, { pickFeaturedVideo } from '../components/FeaturedBanner';
import { useNavigate } from 'react-router-dom';
import {
  fetchUserFeedback,
  normalizeFeedbackEntries,
  filterVideosByFeedback,
  buildRecommendedVideos,
} from '../utils/userFeedback';

const DEFAULT_CATEGORIES = [
  'Nacionais', 'Internacionais', 'Não solucionados', 'Solucionados',
  'Serial Killers', 'Documentários', 'Sobrenaturais',
];

export default function Explore({ user }) {
  const navigate = useNavigate();
  const [groupedVideos, setGroupedVideos] = useState({});
  const [categories, setCategories] = useState([]);
  const [featuredVideo, setFeaturedVideo] = useState(null);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [shorts, setShorts] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);

      const [
        shortsRes,
        categoriesRes,
        videosRes,
        feedbackRes,
      ] = await Promise.all([
        supabase
          .from('videos')
          .select('*, creator_id (id, username, "creatorAvatar")')
          .eq('is_short', true)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('categories')
          .select('name')
          .order('created_at', { ascending: true }),
        supabase
          .from('videos')
          .select('*, creator_id (id, username, "creatorAvatar", role)')
          .order('created_at', { ascending: false }),
        user?.id ? fetchUserFeedback(user.id) : Promise.resolve([]),
      ]);

      if (shortsRes.error) {
        console.error('Erro ao buscar shorts:', shortsRes.error);
      } else {
        setShorts(shortsRes.data || []);
      }

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

      const regularVideos = (videosRes.data || []).filter((video) => !video.is_short);
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

      const visibleShorts = filterVideosByFeedback(shortsRes.data || [], feedbackEntries);

      setFeaturedVideo(pickFeaturedVideo(visibleVideos.length ? visibleVideos : regularVideos));
      setRecommendedVideos(recommended);
      setShorts(visibleShorts);
      setCategories(categoryOrder);
      setGroupedVideos(groups);
      setLoading(false);
    };

    fetchInitialData();
  }, [user?.id]);

  const handleNavigation = (path) => {
    setIsNavigating(true);
    setTimeout(() => { navigate(path); }, 500);
  };

  const hasContent = useMemo(
    () => recommendedVideos.length > 0
      || shorts.length > 0
      || categories.some((category) => groupedVideos[category]?.length > 0),
    [recommendedVideos.length, shorts.length, categories, groupedVideos]
  );

  return (
    <AnimatedPage>
      <div className={`bg-dark-pure transition-opacity duration-500 ${isNavigating ? 'opacity-0' : 'opacity-100'}`}>
        {!loading && featuredVideo && (
          <FeaturedBanner featuredVideo={featuredVideo} onNavigate={handleNavigation} />
        )}

        <div className="space-y-12 py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="h-8 w-1/4 bg-dark-panel animate-pulse" />
                <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex-shrink-0 w-64">
                      <SkeletonCard />
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <>
              {recommendedVideos.length > 0 && (
                <CategoryRow
                  key="recommended-for-you"
                  title="Recomendados para Você"
                  videos={recommendedVideos}
                  onNavigate={handleNavigation}
                  linkable={false}
                />
              )}

              {shorts.length > 0 && (
                <CategoryRow
                  key="shorts-updates"
                  title="Atualizações e Shorts"
                  videos={shorts}
                  onNavigate={handleNavigation}
                  variant="short"
                />
              )}

              {categories.map((category) => (
                <CategoryRow
                  key={category}
                  title={category}
                  videos={groupedVideos[category]}
                  onNavigate={handleNavigation}
                />
              ))}

              {!hasContent && (
                <p className="text-center text-zinc-500 font-mono uppercase tracking-wider text-sm py-16">
                  Nenhum caso disponível no catálogo.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
}
