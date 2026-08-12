import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getPartnerProfilePath } from '../utils/partnerProfile';
import SiteContainer from './SiteContainer';
import WatchlistButton from './WatchlistButton';

const MARCOS_CAMPOS_CREATOR_ID = 'd0781217-8eb0-4d8d-b32b-ce785dbb6227';
const TRAILER_DELAY_MS = 3000;
const ROTATION_INTERVAL_MS = 8000;
const MAX_FEATURED_SLIDES = 5;

const VolumeHighIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const VolumeMuteIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

const ChevronLeftIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

function sortByViewsDesc(videos) {
  return [...videos].sort(
    (a, b) => (Number(b.views) || 0) - (Number(a.views) || 0),
  );
}

export function pickFeaturedVideo(videos) {
  const featured = pickFeaturedVideos(videos, 1);
  return featured[0] || null;
}

export function pickFeaturedVideos(videos, limit = MAX_FEATURED_SLIDES) {
  if (!videos?.length) return [];

  const sorted = sortByViewsDesc(videos);
  const marcosVideo = sorted.find((video) => {
    const creatorId = video.creator_id?.id || video.creator_id;
    return String(creatorId) === MARCOS_CAMPOS_CREATOR_ID;
  });

  const picked = [];
  if (marcosVideo) picked.push(marcosVideo);

  sorted.forEach((video) => {
    if (picked.length >= limit) return;
    if (!picked.some((item) => item.id === video.id)) {
      picked.push(video);
    }
  });

  return picked.slice(0, limit);
}

function stopHeroClick(event) {
  event.stopPropagation();
}

export default function FeaturedBanner({ featuredVideos, featuredVideo, onNavigate, user }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isRotationPaused, setIsRotationPaused] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [rotationResetKey, setRotationResetKey] = useState(0);
  const textRef = useRef(null);

  const slides = useMemo(() => {
    if (featuredVideos?.length) return featuredVideos.slice(0, MAX_FEATURED_SLIDES);
    if (featuredVideo) return [featuredVideo];
    return [];
  }, [featuredVideos, featuredVideo]);

  const slideIdsKey = slides.map((slide) => slide.id).join(',');

  const currentVideo = slides[activeIndex] || null;

  const heroDescription = useMemo(() => {
    if (!currentVideo) return '';
    return (currentVideo.description || currentVideo.synopsis || '').trim();
  }, [currentVideo]);

  useEffect(() => {
    setHasOverflow(false);
  }, [currentVideo?.id, heroDescription]);

  useLayoutEffect(() => {
    const checkOverflow = () => {
      const el = textRef.current;
      if (!el || !heroDescription || isExpanded) return;

      setHasOverflow(el.scrollHeight > el.clientHeight + 1);
    };

    checkOverflow();

    const rafId = window.requestAnimationFrame(checkOverflow);
    window.addEventListener('resize', checkOverflow);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined' && textRef.current) {
      resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(textRef.current);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', checkOverflow);
      resizeObserver?.disconnect();
    };
  }, [heroDescription, isExpanded, currentVideo?.id]);

  const navigateToVideo = useCallback((videoId) => {
    if (!videoId) return;
    const path = `/video/${videoId}`;
    if (onNavigate) onNavigate(path);
    else navigate(path);
  }, [navigate, onNavigate]);

  useEffect(() => {
    setActiveIndex(0);
    setIsExpanded(false);
    setShowTrailer(false);
  }, [slideIdsKey]);

  useEffect(() => {
    setIsExpanded(false);
    setShowTrailer(false);
    setHasOverflow(false);
  }, [currentVideo?.id]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 24) {
        setHasScrolled(true);
        setShowTrailer(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const resetAutoplay = useCallback(() => {
    setRotationResetKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (slides.length <= 1 || isRotationPaused) return undefined;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [slides.length, isRotationPaused, slideIdsKey, rotationResetKey]);

  useEffect(() => {
    if (!currentVideo?.videoUrl || hasScrolled) return undefined;

    const timer = setTimeout(() => {
      if (!hasScrolled) setShowTrailer(true);
    }, TRAILER_DELAY_MS);

    return () => clearTimeout(timer);
  }, [currentVideo?.videoUrl, currentVideo?.id, hasScrolled]);

  useEffect(() => {
    const trailer = videoRef.current;
    if (!trailer) return undefined;

    if (showTrailer) {
      trailer.muted = isMuted;
      const playPromise = trailer.play();
      if (playPromise?.catch) {
        playPromise.catch(() => setShowTrailer(false));
      }
    } else {
      trailer.pause();
      trailer.currentTime = 0;
    }

    return undefined;
  }, [showTrailer, isMuted, currentVideo?.id]);

  if (!currentVideo) return null;

  const creator = currentVideo.creator_id;
  const creatorProfilePath = getPartnerProfilePath(creator);
  const thumbnail = currentVideo.thumbnail || currentVideo.thumbnail_url;
  const titleLength = currentVideo.title?.length || 0;
  const titleSizeClass = titleLength > 50
    ? 'text-xl md:text-2xl lg:text-3xl'
    : 'text-2xl md:text-3xl lg:text-4xl';
  const categories = Array.isArray(currentVideo.category)
    ? currentVideo.category
    : currentVideo.category
      ? [currentVideo.category]
      : [];

  const handleBannerClick = () => {
    navigateToVideo(currentVideo.id);
  };

  const handleWatch = (event) => {
    stopHeroClick(event);
    navigateToVideo(currentVideo.id);
  };

  const toggleMute = (event) => {
    stopHeroClick(event);
    setIsMuted((prev) => !prev);
    if (videoRef.current) videoRef.current.muted = !isMuted;
  };

  const nextSlide = (event) => {
    stopHeroClick(event);
    setActiveIndex((prev) => (prev + 1) % slides.length);
    resetAutoplay();
  };

  const prevSlide = (event) => {
    stopHeroClick(event);
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
    resetAutoplay();
  };

  const heroArrowClass =
    'absolute top-1/2 z-30 flex h-12 w-12 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-zinc-700/60 bg-black/50 text-white/80 opacity-0 shadow-2xl transition-all duration-300 hover:border-amber-500 hover:bg-amber-500 hover:text-black group-hover:opacity-100';

  return (
    <div
      className="FeaturedBanner group relative w-full min-h-[450px] cursor-pointer overflow-hidden bg-zinc-950 md:min-h-[550px]"
      onClick={handleBannerClick}
      onMouseEnter={() => setIsRotationPaused(true)}
      onMouseLeave={() => setIsRotationPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleBannerClick();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Abrir caso: ${currentVideo.title}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="h-full w-full transition-transform duration-700 group-hover:scale-105">
          {thumbnail && (
            <img
              src={thumbnail}
              alt=""
              className={`h-full w-full object-cover object-right transition-opacity duration-1000 md:object-center ${
                showTrailer ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )}

          {currentVideo.videoUrl && (
            <video
              ref={videoRef}
              src={currentVideo.videoUrl}
              className={`absolute inset-0 h-full w-full object-cover object-right transition-opacity duration-1000 md:object-center ${
                showTrailer ? 'opacity-100' : 'opacity-0'
              }`}
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
            />
          )}
        </div>

        <div className="pointer-events-none absolute left-0 right-0 top-0 h-28 bg-gradient-to-b from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black via-black/70 to-transparent md:h-44" />
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className={`${heroArrowClass} left-4`}
            aria-label="Slide anterior"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            className={`${heroArrowClass} right-4`}
            aria-label="Próximo slide"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}

      {slides.length > 1 && (
        <div
          className="absolute bottom-6 right-4 z-20 flex items-center gap-1.5 sm:right-8"
          onClick={stopHeroClick}
          onKeyDown={stopHeroClick}
          role="tablist"
          aria-label="Slides do destaque"
        >
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Destaque ${index + 1}: ${slide.title}`}
              onClick={() => setActiveIndex(index)}
              className={`h-0.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? 'w-8 bg-brand-primary'
                  : 'w-5 bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 flex min-h-[450px] flex-col justify-end pt-28 pb-16 md:min-h-[550px] md:pt-36">
        <SiteContainer>
          <div className="max-w-2xl">
            {categories[0] && (
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-primary mb-2">
                {categories[0]}
              </p>
            )}

            <h1 className={`${titleSizeClass} font-mono font-extrabold uppercase tracking-wider leading-snug text-white max-w-2xl mb-2`}>
              {currentVideo.title}
            </h1>

            {creator?.username && (
              <p className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                Por{' '}
                {creatorProfilePath ? (
                  <Link
                    to={creatorProfilePath}
                    onClick={stopHeroClick}
                    className="underline-offset-2 transition-colors hover:text-brand-primary hover:underline"
                  >
                    {creator.username}
                  </Link>
                ) : (
                  creator.username
                )}
              </p>
            )}

            {heroDescription && (
              <>
                <p
                  ref={textRef}
                  className={`max-w-xl text-sm text-zinc-300 md:text-base ${
                    !isExpanded ? 'line-clamp-3' : ''
                  }`}
                >
                  {heroDescription}
                </p>
                {(hasOverflow || isExpanded) && (
                  <button
                    type="button"
                    onClick={(event) => {
                      stopHeroClick(event);
                      setIsExpanded((prev) => !prev);
                    }}
                    className="mt-2 block cursor-pointer font-mono text-xs font-bold uppercase tracking-wider text-amber-500 transition-colors hover:text-amber-400"
                  >
                    {isExpanded ? 'Ver menos' : 'Ver mais...'}
                  </button>
                )}
              </>
            )}

            <div
              className="mt-4 flex flex-wrap items-center gap-3"
              onClick={stopHeroClick}
              onKeyDown={stopHeroClick}
              role="presentation"
            >
              <button
                type="button"
                onClick={handleWatch}
                className="touch-target whitespace-nowrap rounded-none bg-brand-primary px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-black transition-opacity hover:opacity-90"
              >
                ASSISTIR
              </button>

              <WatchlistButton
                userId={user?.id}
                videoId={currentVideo.id}
                variant="hero"
                loginReturnPath="/casos"
              />

              {showTrailer && currentVideo.videoUrl && (
                <button
                  type="button"
                  onClick={toggleMute}
                  className="touch-target flex items-center justify-center rounded-none border border-dark-border bg-dark-panel/60 p-3 text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                  aria-label={isMuted ? 'Ativar som do trailer' : 'Silenciar trailer'}
                >
                  {isMuted ? <VolumeMuteIcon className="h-4 w-4" /> : <VolumeHighIcon className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        </SiteContainer>
      </div>
    </div>
  );
}
