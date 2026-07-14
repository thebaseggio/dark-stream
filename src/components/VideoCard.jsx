import React from 'react';
import { useNavigate } from 'react-router-dom';

const VerifiedIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10.09,16.5L6.5,12.91L7.91,11.5L10.09,13.67L16.08,7.68L17.5,9.09L10.09,16.5Z" />
  </svg>
);

function getThumbnail(video) {
  return video.thumbnail || video.thumbnail_url;
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

function formatDuration(video) {
  if (video.duration) return video.duration;
  if (video.runtime) return video.runtime;
  return null;
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

export default function VideoCard({ video, onNavigate, orientation = 'vertical', variant = 'default' }) {
  const navigate = useNavigate();
  const thumbnail = getThumbnail(video);

  const handleCardClick = () => {
    const path = `/video/${video.id}`;
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
        <div className="w-40 flex-shrink-0 border border-dark-border overflow-hidden">
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full aspect-video object-cover transition-opacity duration-300 group-hover:opacity-80"
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
        <div className="relative border border-dark-border overflow-hidden">
          <img
            src={thumbnail}
            alt={video.title}
            className="w-full aspect-[9/16] object-cover"
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

  const duration = formatDuration(video);
  const ratingLabel = formatRatingLabel(video);

  return (
    <div
      className="relative flex-shrink-0 w-64 cursor-pointer group/card transition-transform duration-300 ease-out hover:scale-105 hover:z-30"
      onClick={handleCardClick}
    >
      <div className="relative border border-dark-border overflow-hidden bg-dark-panel">
        <img
          src={thumbnail}
          alt={video.title}
          className="w-full aspect-video object-cover"
        />

        <div className="absolute inset-x-0 bottom-0 translate-y-2 opacity-0 group-hover/card:translate-y-0 group-hover/card:opacity-100 transition-all duration-300">
          <div className="bg-gradient-to-t from-black via-black/85 to-transparent px-3 pb-3 pt-10">
            <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-zinc-300">
              <span className="truncate">{getCreatorName(video)}</span>
              {getCreatorRole(video) === 'partner' && (
                <VerifiedIcon className="w-3 h-3 text-zinc-500 flex-shrink-0" title="Parceiro Verificado" />
              )}
            </div>
            <div className="flex items-center justify-between gap-2 mt-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              <span>{duration || formattedViews(video.views)}</span>
              {ratingLabel && (
                <span className="text-brand-primary/80">{ratingLabel} ★</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <h3 className="mt-2 text-[11px] font-mono uppercase tracking-wider text-zinc-400 line-clamp-2 leading-snug group-hover/card:text-brand-primary transition-colors">
        {video.title}
      </h3>
      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mt-1">
        {formattedViews(video.views)} · {timeAgo(video.created_at)}
      </p>
    </div>
  );
}
