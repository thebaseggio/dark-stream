import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const MARCOS_CAMPOS_CREATOR_ID = 'd0781217-8eb0-4d8d-b32b-ce785dbb6227';
const TRAILER_DELAY_MS = 3000;

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

export function pickFeaturedVideo(videos) {
  if (!videos?.length) return null;

  const marcosVideo = videos.find((video) => {
    const creatorId = video.creator_id?.id || video.creator_id;
    return String(creatorId) === MARCOS_CAMPOS_CREATOR_ID;
  });

  return marcosVideo || videos[0];
}

export default function FeaturedBanner({ featuredVideo, onNavigate }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

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

  useEffect(() => {
    if (!featuredVideo?.videoUrl || hasScrolled) return undefined;

    const timer = setTimeout(() => {
      if (!hasScrolled) setShowTrailer(true);
    }, TRAILER_DELAY_MS);

    return () => clearTimeout(timer);
  }, [featuredVideo?.videoUrl, hasScrolled]);

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
  }, [showTrailer, isMuted]);

  if (!featuredVideo) return null;

  const creator = featuredVideo.creator_id;
  const thumbnail = featuredVideo.thumbnail || featuredVideo.thumbnail_url;
  const categories = Array.isArray(featuredVideo.category)
    ? featuredVideo.category
    : featuredVideo.category
      ? [featuredVideo.category]
      : [];

  const handleWatch = () => {
    const path = `/video/${featuredVideo.id}`;
    if (onNavigate) onNavigate(path);
    else navigate(path);
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
    if (videoRef.current) videoRef.current.muted = !isMuted;
  };

  return (
    <section className="relative w-full h-[52vh] min-h-[300px] max-h-[560px] overflow-hidden border-b border-dark-border">
      {thumbnail && (
        <img
          src={thumbnail}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            showTrailer ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {featuredVideo.videoUrl && (
        <video
          ref={videoRef}
          src={featuredVideo.videoUrl}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            showTrailer ? 'opacity-100' : 'opacity-0'
          }`}
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-r from-dark-pure via-dark-pure/75 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-pure via-transparent to-dark-pure/30" />

      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-10 sm:pb-14">
        <div className="max-w-2xl space-y-4">
          {categories[0] && (
            <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-primary">
              {categories[0]}
            </p>
          )}

          <h1 className="font-anton text-3xl sm:text-5xl lg:text-6xl text-white leading-tight">
            {featuredVideo.title}
          </h1>

          {creator?.username && (
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Por {creator.username}
            </p>
          )}

          {featuredVideo.description && (
            <p className="text-sm text-zinc-400 line-clamp-3 max-w-xl hidden sm:block">
              {featuredVideo.description}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleWatch}
              className="rounded-none bg-brand-primary text-black font-mono uppercase tracking-wider text-xs px-6 py-3 hover:opacity-90 transition-opacity"
            >
              Assistir
            </button>

            {showTrailer && featuredVideo.videoUrl && (
              <button
                type="button"
                onClick={toggleMute}
                className="rounded-none border border-dark-border bg-dark-panel/60 text-zinc-300 p-3 hover:text-white hover:border-zinc-500 transition-colors"
                aria-label={isMuted ? 'Ativar som do trailer' : 'Silenciar trailer'}
              >
                {isMuted ? <VolumeMuteIcon className="w-4 h-4" /> : <VolumeHighIcon className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
