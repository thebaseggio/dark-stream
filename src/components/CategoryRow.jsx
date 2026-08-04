import React from 'react';
import CarouselContainer from './CarouselContainer';
import VideoCard from './VideoCard';

export default function CategoryRow({
  title,
  videos,
  onNavigate,
  variant,
  linkable = true,
  showProgressBar = false,
}) {
  if (!videos || videos.length === 0) return null;

  const handleTitleClick = () => {
    if (!linkable) return;
    onNavigate(`/categoria/${encodeURIComponent(title)}`);
  };

  return (
    <div className="relative min-w-0 max-w-full space-y-4">
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
            showProgressBar={showProgressBar}
          />
        ))}
      </CarouselContainer>
    </div>
  );
}
