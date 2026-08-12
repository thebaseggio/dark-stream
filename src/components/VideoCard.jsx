import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { buildVideoPathWithResume } from '../utils/videoPlayback';
import { playIntroSound, unlockAudioContext } from '../utils/soundEffects';
import WatchlistButton from './WatchlistButton';

const VerifiedIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10.09,16.5L6.5,12.91L7.91,11.5L10.09,13.67L16.08,7.68L17.5,9.09L10.09,16.5Z" />
  </svg>
);

function getThumbnail(video) {
  return video.thumbnail || video.thumbnail_url;
}

function VideoThumbnail({ src, alt, className, title }) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  if (showFallback) {
    return (
      <div
        className={`${className} flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#0f0406] via-[#1a0808] to-black p-3 text-center`}
      >
        <img src="/LogoT.png" alt="Dark Stream" className="h-8 w-auto opacity-80" />
        <span className="line-clamp-2 px-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-zinc-200">
          {title || 'Dark Stream'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function getCreatorName(video) {
  return video.creator?.username
    || video.creator_id?.username
    || video.creator_username
    || 'Parceiro';
}

function getCreatorRole(video) {
  return video.creator?.role || video.creator_role;
}

function formatDurationLabel(video) {
  const candidates = [video.duration, video.runtime, video.duration_seconds];

  for (const value of candidates) {
    if (typeof value === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(value.trim())) {
      return value.trim();
    }
  }

  const seconds = Number(
    video.duration_seconds ?? (
      typeof video.duration === 'number'
        ? video.duration
        : typeof video.runtime === 'number'
          ? video.runtime
          : Number(video.duration ?? video.runtime)
    ),
  );

  if (!Number.isFinite(seconds) || seconds <= 0) return null;

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getDaysSinceCreation(timestamp) {
  if (!timestamp) return Infinity;
  const now = new Date();
  const created = new Date(timestamp);
  const diffMs = now.getTime() - created.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function isNewVideo(video) {
  return getDaysSinceCreation(video?.created_at) < 7;
}

function formatRatingLabel(video) {
  if (isNewVideo(video)) return 'NOVO';

  const likes = (video.gostei || 0) + (video.gostei_muito || 0);
  if (likes >= 1000) return `${(likes / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  if (likes > 0) return `${likes}`;
  return null;
}

export default function VideoCard({
  video,
  onNavigate,
  orientation = 'vertical',
  variant = 'default',
  fullWidth = false,
  inCarousel = false,
  progressPercent,
  showProgressBar = false,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const thumbnail = getThumbnail(video);
  const watchProgress = progressPercent ?? video.watchProgressPercent;
  const displayProgress = showProgressBar && typeof watchProgress === 'number' && watchProgress > 0;

  const handleCardClick = () => {
    const isResume = showProgressBar && video.watchProgressSeconds > 0;
    const path = isResume
      ? buildVideoPathWithResume(video.id, video.watchProgressSeconds)
      : `/video/${video.id}`;

    void unlockAudioContext();
    if (!isResume) {
      void playIntroSound();
    }

    if (onNavigate) onNavigate(path);
    else navigate(path);
  };

  const formattedViews = (views) => {
    if (!views) return '0 views';
    if (views >= 1000000) return `${(views / 1000000).toFixed(1).replace(/\.0$/, '')}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, '')}K views`;
    return `${views} views`;
  };

  const timeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);
    const minutes = Math.floor(diffInSeconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(months / 12);

    if (years > 0) return `${years}a`;
    if (months > 0) return `${months}m`;
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}min`;
    return 'agora';
  };

  if (orientation === 'horizontal') {
    return (
      <div className="flex gap-4 cursor-pointer group" onClick={handleCardClick}>
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-zinc-900 flex-shrink-0 sm:w-40">
          <VideoThumbnail
            src={thumbnail}
            alt={video.title}
            title={video.title}
            className="h-full w-full object-cover object-center transition-opacity duration-300 group-hover:opacity-80"
          />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-300 line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">
            {video.title}
          </h3>
          <div className="flex items-center text-zinc-500 text-[10px] font-mono uppercase tracking-wider mt-2 gap-2">
            <img
              src={video.creator?.creatorAvatar || `https://ui-avatars.com/api/?name=${getCreatorName(video).charAt(0)}`}
              alt={getCreatorName(video)}
              className="w-5 h-5 object-cover border border-dark-border"
            />
            <span>{getCreatorName(video)}</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'short') {
    return (
      <div
        className="relative flex-shrink-0 w-44 cursor-pointer group/card transition-transform duration-300 ease-out hover:scale-105 hover:z-30"
        onClick={handleCardClick}
      >
        <div className="relative aspect-[9/16] overflow-hidden border border-dark-border">
          <VideoThumbnail
            src={thumbnail}
            alt={video.title}
            title={video.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover/card:opacity-100 transition-opacity duration-300" />
          {video.short_type === 'update' && (
            <span className="absolute top-2 left-2 bg-dark-panel border border-dark-border text-zinc-300 text-[9px] font-mono uppercase tracking-wider px-2 py-1">Update</span>
          )}
          {video.short_type === 'intro' && (
            <span className="absolute top-2 left-2 bg-dark-panel border border-dark-border text-zinc-300 text-[9px] font-mono uppercase tracking-wider px-2 py-1">Prévia</span>
          )}
          {video.short_type === 'flash' && (
            <span className="absolute top-2 left-2 bg-dark-panel border border-dark-border text-zinc-300 text-[9px] font-mono uppercase tracking-wider px-2 py-1">Flash</span>
          )}
          <div className="absolute bottom-2 left-2 right-2">
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 line-clamp-2 leading-snug group-hover/card:text-brand-primary transition-colors">
              {video.title}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  const durationLabel = formatDurationLabel(video);
  const ratingLabel = formatRatingLabel(video);
  const widthClass = fullWidth
    ? 'w-full max-w-full'
    : inCarousel
      ? 'flex-none snap-start w-[75vw] sm:w-[40vw] md:w-[25vw] min-w-0 max-w-full'
      : 'w-64 max-w-full flex-shrink-0 sm:w-72 lg:w-80 xl:w-[300px]';

  return (
    <div
      className={`relative ${widthClass} min-w-0 max-w-full cursor-pointer group/card`}
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden rounded-lg border border-dark-border">
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-zinc-900">
          <VideoThumbnail
            src={thumbnail}
            alt={video.title}
            title={video.title}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover/card:scale-105"
          />

        {displayProgress && watchProgress < 95 && (
          <div className="absolute inset-x-0 bottom-0 z-10 h-1 bg-zinc-900/90">
            <div
              className="h-full bg-brand-primary transition-all duration-300"
              style={{ width: `${watchProgress}%` }}
            />
          </div>
        )}

        {durationLabel && (
          <span className="absolute bottom-2 right-2 z-10 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-zinc-200">
            {durationLabel}
          </span>
        )}

        <div
          className="absolute top-2 right-2 z-20 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
          onClick={(event) => {
            event.stopPropagation();
            event.preventDefault();
          }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <WatchlistButton
            userId={user?.id}
            videoId={video.id}
            variant="card"
            loginReturnPath={`/video/${video.id}`}
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300">
          <div className="bg-gradient-to-t from-black via-black/85 to-transparent px-3 pb-3 pt-10">
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-300">
              <span className="truncate">{getCreatorName(video)}</span>
              {getCreatorRole(video) === 'partner' && (
                <VerifiedIcon className="w-3 h-3 text-zinc-500 flex-shrink-0" title="Parceiro Verificado" />
              )}
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              <span className="normal-case tracking-wide">{durationLabel || formattedViews(video.views)}</span>
              {ratingLabel && (
                <span className="text-brand-primary/80">{ratingLabel} ★</span>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>

      <div className="mt-2 px-1">
        <h3 className="text-[11px] font-mono uppercase tracking-wider text-white line-clamp-2 leading-snug group-hover/card:text-brand-primary transition-colors duration-300">
          {video.title}
        </h3>
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mt-1">
          {formattedViews(video.views)} · {timeAgo(video.created_at)}
        </p>
      </div>
    </div>
  );
}
