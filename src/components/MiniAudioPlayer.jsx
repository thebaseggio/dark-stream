import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Headphones, Maximize2, Pause, Play, X } from 'lucide-react';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';

function formatTime(timeInSeconds) {
  if (!Number.isFinite(timeInSeconds)) return '00:00';
  const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
  const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function isVideoPlayerRoute(pathname) {
  return /^\/(video|caso)\/[^/]+$/.test(pathname);
}

export default function MiniAudioPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    progress,
    isMiniPlayerVisible,
    togglePlayPause,
    seek,
    stopTrack,
  } = useAudioPlayer();

  const onVideoPage = isVideoPlayerRoute(location.pathname);
  const shouldRender = isMiniPlayerVisible && !onVideoPage;

  useEffect(() => {
    document.body.classList.toggle('has-mini-audio-player', shouldRender);
    return () => document.body.classList.remove('has-mini-audio-player');
  }, [shouldRender]);

  if (!shouldRender) return null;

  const handleExpand = () => {
    navigate(`/video/${currentTrack.id}`);
  };

  const handleClose = () => {
    stopTrack();
  };

  const handleProgressClick = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    if (duration > 0) {
      seek(ratio * duration);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur-lg sm:px-6"
      role="region"
      aria-label="Player de áudio"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-2">
        <div
          className="group relative h-1 w-full cursor-pointer overflow-hidden rounded-none bg-zinc-800"
          onClick={handleProgressClick}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do áudio"
        >
          <div
            className="h-full bg-amber-500 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <img
              src={currentTrack.thumbnail}
              alt=""
              className="h-12 w-12 flex-shrink-0 rounded-none border border-zinc-800 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Headphones className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" aria-hidden="true" />
                <p className="truncate font-mono text-xs uppercase tracking-wider text-amber-500">
                  Dossiê em Áudio
                </p>
              </div>
              <p className="truncate text-sm font-semibold text-white">{currentTrack.title}</p>
              <p className="truncate text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                {currentTrack.partnerName || 'Parceiro'}
              </p>
            </div>
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            <span className="hidden font-mono text-[10px] tracking-wider text-zinc-500 sm:inline">
              {formatTime(currentTime)}
              {' '}
              /
              {' '}
              {formatTime(duration)}
            </span>

            <button
              type="button"
              onClick={togglePlayPause}
              className="flex h-10 w-10 items-center justify-center rounded-none border border-zinc-700 bg-zinc-900 text-white transition-colors hover:border-amber-500 hover:text-amber-500"
              aria-label={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={handleExpand}
              className="flex h-10 w-10 items-center justify-center rounded-none border border-zinc-700 bg-zinc-900 text-zinc-300 transition-colors hover:border-amber-500 hover:text-amber-500"
              aria-label="Expandir e voltar ao vídeo"
              title="Voltar ao vídeo"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="flex h-10 w-10 items-center justify-center rounded-none border border-zinc-700 bg-zinc-900 text-zinc-400 transition-colors hover:border-red-500/60 hover:text-red-400"
              aria-label="Fechar player de áudio"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
