import React from 'react';
import { useNavigate } from 'react-router-dom';

const VerifiedIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10.09,16.5L6.5,12.91L7.91,11.5L10.09,13.67L16.08,7.68L17.5,9.09L10.09,16.5Z" />
  </svg>
);

export default function VideoCard({ video, onNavigate, orientation = 'vertical', variant = 'default' }) {
  const navigate = useNavigate();

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
            src={video.thumbnail}
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
              src={video.creator?.creatorAvatar || `https://ui-avatars.com/api/?name=${video.creator?.username?.charAt(0)}`}
              alt={video.creator?.username}
              className="w-5 h-5 object-cover border border-dark-border"
            />
            <span>{video.creator?.username}</span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'short') {
    return (
      <div className="w-44 flex-shrink-0 cursor-pointer group" onClick={handleCardClick}>
        <div className="relative border border-dark-border overflow-hidden">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full aspect-[9/16] object-cover transition-opacity duration-300 group-hover:opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2">
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">
              {video.title}
            </h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full cursor-pointer group" onClick={handleCardClick}>
      <div className="border border-dark-border overflow-hidden">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-40 object-cover transition-opacity duration-300 group-hover:opacity-80"
        />
      </div>
      <div className="mt-2 space-y-1">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-300 line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
          <span>{video.creator_username}</span>
          {video.creator_role === 'partner' && (
            <VerifiedIcon className="w-3 h-3 text-zinc-500" title="Parceiro Verificado" />
          )}
        </div>
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
          {formattedViews(video.views)} · {timeAgo(video.created_at)}
        </p>
      </div>
    </div>
  );
}
