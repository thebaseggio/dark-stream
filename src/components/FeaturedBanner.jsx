import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getPartnerProfilePath } from '../utils/partnerProfile';
import SiteContainer from './SiteContainer';

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
  const creatorProfilePath = getPartnerProfilePath(creator);
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
    <div className="FeaturedBanner relative w-full min-h-[450px] overflow-hidden bg-zinc-950 md:min-h-[550px]">
      <div className="absolute inset-0">
        {thumbnail && (
          <img
            src={thumbnail}
            alt=""
            className={`h-full w-full object-cover object-right transition-opacity duration-1000 md:object-center ${
              showTrailer ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}

        {featuredVideo.videoUrl && (
          <video
            ref={videoRef}
            src={featuredVideo.videoUrl}
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

        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/70 to-transparent md:h-40" />
      </div>

      <div className="relative z-10 flex min-h-[450px] flex-col justify-end py-16 sm:py-24 md:min-h-[550px]">
        <SiteContainer>
          <div className="max-w-2xl space-y-4">
            {categories[0] && (
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-primary">
                {categories[0]}
              </p>
            )}

            <h1 className="font-anton text-3xl leading-tight text-white sm:text-5xl lg:text-6xl">
              {featuredVideo.title}
            </h1>

            {creator?.username && (
              <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Por{' '}
                {creatorProfilePath ? (
                  <Link
                    to={creatorProfilePath}
                    className="underline-offset-2 transition-colors hover:text-brand-primary hover:underline"
                  >
                    {creator.username}
                  </Link>
                ) : (
                  creator.username
                )}
              </p>
            )}

            {featuredVideo.description && (
              <p className="hidden text-sm leading-relaxed text-zinc-400 line-clamp-3 sm:block">
                {featuredVideo.description}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleWatch}
                className="touch-target rounded-none bg-brand-primary px-6 py-3 font-mono text-xs uppercase tracking-wider text-black transition-opacity hover:opacity-90"
              >
                Assistir
              </button>

              {showTrailer && featuredVideo.videoUrl && (
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
