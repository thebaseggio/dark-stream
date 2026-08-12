import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const AudioPlayerContext = createContext(null);

export function useAudioPlayer() {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error('useAudioPlayer deve ser usado dentro de AudioPlayerProvider');
  }
  return ctx;
}

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const pendingStartRef = useRef(null);
  const playbackTimeRef = useRef(0);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAudioMode, setIsAudioMode] = useState(false);

  const progress = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return (currentTime / duration) * 100;
  }, [currentTime, duration]);

  const isMiniPlayerVisible = useMemo(
    () => Boolean(currentTrack && isMinimized),
    [currentTrack, isMinimized],
  );

  const stopTrack = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsMinimized(false);
    setIsAudioMode(false);
    setIsMuted(false);
    pendingStartRef.current = null;
    playbackTimeRef.current = 0;
  }, []);

  const applyMediaSettings = useCallback((audio, settings = {}) => {
    if (!audio) return;

    if (settings.volume !== undefined) {
      const nextVolume = Math.max(0, Math.min(1, settings.volume));
      audio.volume = nextVolume;
      setVolumeState(nextVolume);
    }

    if (settings.muted !== undefined) {
      audio.muted = settings.muted;
      setIsMuted(settings.muted);
    }
  }, []);

  const enterAudioMode = useCallback((track, startTime = 0, autoPlay = true, mediaSettings = {}) => {
    if (!track?.videoUrl) return;

    const syncedTime = Number.isFinite(startTime) ? startTime : 0;
    playbackTimeRef.current = syncedTime;
    pendingStartRef.current = { startTime: syncedTime, autoPlay, mediaSettings };
    setCurrentTrack(track);
    setIsAudioMode(true);
    setIsMinimized(true);
    setCurrentTime(syncedTime);

    if (mediaSettings.volume !== undefined) {
      setVolumeState(Math.max(0, Math.min(1, mediaSettings.volume)));
    }
    if (mediaSettings.muted !== undefined) {
      setIsMuted(Boolean(mediaSettings.muted));
    }
  }, []);

  const exitAudioMode = useCallback(() => {
    const audio = audioRef.current;
    const resumeTime = audio?.currentTime ?? playbackTimeRef.current ?? currentTime;

    playbackTimeRef.current = resumeTime;
    setCurrentTime(resumeTime);

    if (audio) {
      audio.pause();
    }

    setIsPlaying(false);
    setIsAudioMode(false);
    setIsMinimized(false);
    setCurrentTrack(null);
    pendingStartRef.current = null;

    return resumeTime;
  }, [currentTime]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextMuted = !audio.muted;
    audio.muted = nextMuted;
    setIsMuted(nextMuted);

    if (!nextMuted && audio.volume === 0) {
      const restored = volume > 0 ? volume : 0.8;
      audio.volume = restored;
      setVolumeState(restored);
    }
  }, [volume]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (audio.paused) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [currentTrack]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(time)) return;

    const clamped = Math.max(0, Math.min(duration || audio.duration || 0, time));
    audio.currentTime = clamped;
    playbackTimeRef.current = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  const setVolume = useCallback((value) => {
    const next = Math.max(0, Math.min(1, value));
    setVolumeState(next);

    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = next;

    if (next > 0) {
      audio.muted = false;
      setIsMuted(false);
    } else {
      audio.muted = true;
      setIsMuted(true);
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    audio.volume = volume;
    audio.muted = isMuted;

    const onTimeUpdate = () => {
      playbackTimeRef.current = audio.currentTime;
      setCurrentTime(audio.currentTime);
    };
    const onDurationChange = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setIsMinimized(true);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('loadedmetadata', onDurationChange);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('loadedmetadata', onDurationChange);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.videoUrl) return undefined;

    const handleCanPlay = () => {
      const pending = pendingStartRef.current;
      if (!pending) return;

      applyMediaSettings(audio, pending.mediaSettings);

      if (pending.startTime > 0) {
        audio.currentTime = pending.startTime;
        playbackTimeRef.current = pending.startTime;
        setCurrentTime(pending.startTime);
      }

      if (pending.autoPlay) {
        audio.play().catch(() => setIsPlaying(false));
      }

      pendingStartRef.current = null;
    };

    audio.src = currentTrack.videoUrl;
    audio.load();
    audio.addEventListener('loadedmetadata', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleCanPlay);
    };
  }, [currentTrack?.id, currentTrack?.videoUrl, applyMediaSettings]);

  const isActiveForVideo = useCallback(
    (videoId) => Boolean(isAudioMode && currentTrack?.id && String(currentTrack.id) === String(videoId)),
    [isAudioMode, currentTrack?.id],
  );

  const value = useMemo(() => ({
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    isMinimized,
    isAudioMode,
    isMiniPlayerVisible,
    enterAudioMode,
    exitAudioMode,
    stopTrack,
    togglePlayPause,
    toggleMute,
    seek,
    setVolume,
    setIsMinimized,
    isActiveForVideo,
  }), [
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    isMinimized,
    isAudioMode,
    isMiniPlayerVisible,
    enterAudioMode,
    exitAudioMode,
    stopTrack,
    togglePlayPause,
    toggleMute,
    seek,
    setVolume,
    isActiveForVideo,
  ]);

  return (
    <AudioPlayerContext.Provider value={value}>
      <audio ref={audioRef} preload="metadata" className="hidden" aria-hidden="true" />
      {children}
    </AudioPlayerContext.Provider>
  );
}
