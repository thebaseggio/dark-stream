// src/pages/Explore.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import SkeletonCard from './SkeletonCard';
import CategoryRow from '../components/CategoryRow';
import FeaturedBanner, { pickFeaturedVideo } from '../components/FeaturedBanner';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';
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

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);

      const [
        categoriesRes,
        videosRes,
        feedbackRes,
      ] = await Promise.all([
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
        user?.id ? fetchUserFeedback(user.id) : Promise.resolve([]),
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

    fetchInitialData();
  }, [user?.id]);

  const handleNavigation = (path) => {
    setIsNavigating(true);
    setTimeout(() => { navigate(path); }, 500);
  };

  const hasContent = useMemo(
    () => recommendedVideos.length > 0
      || categories.some((category) => groupedVideos[category]?.length > 0),
    [recommendedVideos.length, categories, groupedVideos]
  );

  return (
    <AnimatedPage>
      <SeoHead
        title="Explorar Casos | Dark Stream"
        description={DEFAULT_SITE_DESCRIPTION}
      />
      <div className={`transition-opacity duration-500 ${isNavigating ? 'opacity-0' : 'opacity-100'}`}>
        {!loading && featuredVideo && (
          <FeaturedBanner featuredVideo={featuredVideo} onNavigate={handleNavigation} />
        )}

        <div className="space-y-12 pt-8 pb-8">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-4 relative mb-12">
                <div className="h-8 w-48 max-w-[40%] bg-dark-panel animate-pulse rounded-sm" />
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <SkeletonCard key={j} />
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
