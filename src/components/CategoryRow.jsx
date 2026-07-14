import React from 'react';
import CarouselContainer from './CarouselContainer';
import VideoCard from './VideoCard';

export default function CategoryRow({ title, videos, onNavigate, variant, linkable = true }) {
  if (!videos || videos.length === 0) return null;

  const handleTitleClick = () => {
    if (!linkable) return;
    onNavigate(`/categoria/${encodeURIComponent(title)}`);
  };

  return (
    <div className="space-y-4 relative mb-12">
      <div
        onClick={handleTitleClick}
        className={linkable ? 'cursor-pointer' : ''}
        role={linkable ? 'button' : undefined}
        tabIndex={linkable ? 0 : undefined}
        onKeyDown={linkable ? (e) => e.key === 'Enter' && handleTitleClick() : undefined}
      >
        <h2 className={`font-anton text-white text-2xl inline-block ${linkable ? 'hover:text-brand-primary transition-colors' : ''}`}>
          {title}
        </h2>
      </div>

      <CarouselContainer>
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onNavigate={onNavigate}
            variant={variant}
          />
        ))}
      </CarouselContainer>
    </div>
  );
}
