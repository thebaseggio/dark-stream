// src/pages/VideoPlayer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';

const PlayIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
);
const PauseIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
);
const VolumeHighIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
);
const VolumeMuteIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
);
const FullscreenIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
);
const BackIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>
);
const LoadingSpinner = () => (
  <div className="w-10 h-10 border-2 border-zinc-800 border-t-white animate-spin" />
);

const RECOMMEND_VOTE = 'recommend';
const NOT_RECOMMEND_VOTE = 'not_recommend';

function getSessionVoteKey(videoId) {
  return `darkstream:video-vote:${videoId}`;
}

function readSessionVote(videoId) {
  if (!videoId) return null;
  return sessionStorage.getItem(getSessionVoteKey(videoId));
}

function formatCategories(category) {
  if (!category) return null;
  return Array.isArray(category) ? category : [category];
}

export default function VideoPlayer({ user }) {
  const { id: videoId } = useParams();
  const navigate = useNavigate();
  const { chromeVisible = true, reportChromeActivity } = useOutletContext() || {};

  const [video, setVideo] = useState(null);
  const [updateShorts, setUpdateShorts] = useState([]);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [sessionVote, setSessionVote] = useState(null);
  const [isProcessingRating, setIsProcessingRating] = useState(false);

  const [showIntro, setShowIntro] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const [introStep, setIntroStep] = useState(1);
  const [fadeOutFirstPart, setFadeOutFirstPart] = useState(false);
  const [fadeOutSecondPart, setFadeOutSecondPart] = useState(false);

  const inactivityTimerRef = useRef(null);
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);

  const handleFollowToggle = async () => {
    if (!user) { navigate('/login'); return; }
    if (user.id === video.creator_id.id) return;
    setIsProcessingFollow(true);
    if (isSubscribed) {
      const { error } = await supabase.from('subscriptions').delete().match({
        creator_id: video.creator_id.id,
        follower_id: user.id,
      });
      if (!error) {
        setIsSubscribed(false);
        setSubscriberCount((prev) => prev - 1);
      }
    } else {
      const { error } = await supabase.from('subscriptions').insert({
        creator_id: video.creator_id.id,
        follower_id: user.id,
      });
      if (!error) {
        setIsSubscribed(true);
        setSubscriberCount((prev) => prev + 1);
      }
    }
    setIsProcessingFollow(false);
  };

  const handleActivity = () => {
    reportChromeActivity?.();
    setAreControlsVisible(true);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      const currentVideo = videoRef.current;
      if (currentVideo && !currentVideo.paused && !currentVideo.muted) {
        setAreControlsVisible(false);
      }
    }, 3000);
  };

  const togglePlayPause = () => {
    const currentVideo = videoRef.current;
    if (!currentVideo) return;
    if (currentVideo.paused) currentVideo.play();
    else currentVideo.pause();
  };

  const toggleMute = () => {
    const currentVideo = videoRef.current;
    if (!currentVideo) return;
    currentVideo.muted = !currentVideo.muted;
    setIsMuted(currentVideo.muted);
    if (!currentVideo.muted && currentVideo.volume === 0) {
      currentVideo.volume = 1;
      setVolume(1);
    }
  };

  const handleVolumeChange = (e) => {
    const currentVideo = videoRef.current;
    if (!currentVideo) return;
    const newVolume = parseFloat(e.target.value);
    currentVideo.volume = newVolume;
    setVolume(newVolume);
    if (newVolume > 0 && currentVideo.muted) {
      currentVideo.muted = false;
      setIsMuted(false);
    } else if (newVolume === 0) {
      currentVideo.muted = true;
      setIsMuted(true);
    }
  };

  const handleProgressChange = (e) => {
    const currentVideo = videoRef.current;
    if (!currentVideo) return;
    const newTime = parseFloat(e.target.value);
    currentVideo.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) playerContainerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return '00:00';
    const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
    const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const handleFeedbackVote = async (voteType) => {
    if (sessionVote || isProcessingRating) return;

    setIsProcessingRating(true);

    const feedbackType = voteType === RECOMMEND_VOTE ? 'gostei' : 'nao_gostei';
    const { error } = await supabase.rpc('increment_video_feedback', {
      video_row_id: videoId,
      feedback_type: feedbackType,
    });

    if (error) {
      console.error('Erro ao registrar feedback:', error);
    } else {
      sessionStorage.setItem(getSessionVoteKey(videoId), voteType);
      setSessionVote(voteType);
      setVideo((prev) => ({
        ...prev,
        [feedbackType]: (prev?.[feedbackType] || 0) + 1,
      }));
    }

    setIsProcessingRating(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!videoId || !user) return;
      setLoading(true);

      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*, creator_id (id, username, creatorAvatar)')
        .eq('id', videoId)
        .single();

      if (videoError || !videoData) {
        console.error('Erro ao buscar vídeo:', videoError);
        setLoading(false);
        return;
      }

      setVideo(videoData);
      const creatorId = videoData.creator_id.id;

      const [subsCountRes, userSubRes, shortsRes] = await Promise.all([
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('creator_id', creatorId),
        user
          ? supabase.from('subscriptions').select('id').eq('creator_id', creatorId).eq('follower_id', user.id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from('videos')
          .select('id, title, thumbnail')
          .eq('parent_video_id', videoId)
          .eq('is_short', true)
          .order('created_at', { ascending: true }),
      ]);

      setSubscriberCount(subsCountRes.count || 0);
      setIsSubscribed(!!userSubRes.data);
      setSessionVote(readSessionVote(videoId));
      setUpdateShorts(shortsRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [videoId, user]);

  useEffect(() => {
    if (!videoId || !user) return;

    const registerView = async () => {
      const { error } = await supabase.rpc('increment_views', {
        video_row_id: videoId,
        viewer_id: user?.id,
      });
      if (error) console.error('Erro ao registrar view:', error);
    };

    const timer = setTimeout(registerView, 2000);
    return () => clearTimeout(timer);
  }, [videoId, user]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!video?.creator_id?.id) return;
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, thumbnail, creator_id(username)')
        .eq('creator_id', video.creator_id.id)
        .neq('id', videoId)
        .limit(5);

      if (error) console.error('Erro ao buscar vídeos relacionados:', error);
      else setRelatedVideos(data);
    };

    fetchRelated();
  }, [video, videoId]);

  useEffect(() => {
    if (!loading && video) {
      const t1 = setTimeout(() => setFadeOutFirstPart(true), 3500);
      const t2 = setTimeout(() => setIntroStep(2), 4000);
      const t3 = setTimeout(() => setFadeOutSecondPart(true), 7500);
      const t4 = setTimeout(() => setShowIntro(false), 8000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [loading, video]);

  useEffect(() => {
    const currentVideo = videoRef.current;
    if (showIntro === false && currentVideo) {
      currentVideo.muted = true;
      setIsMuted(true);
      const playPromise = currentVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsPlaying(false));
      }
    }
  }, [showIntro]);

  useEffect(() => {
    const currentVideo = videoRef.current;
    if (!currentVideo) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const setVideoDuration = () => setDuration(currentVideo.duration);
    const onTimeUpdate = () => {
      setCurrentTime(currentVideo.currentTime);
      setProgress((currentVideo.currentTime / currentVideo.duration) * 100 || 0);
    };

    currentVideo.addEventListener('play', onPlay);
    currentVideo.addEventListener('pause', onPause);
    currentVideo.addEventListener('timeupdate', onTimeUpdate);
    currentVideo.addEventListener('loadedmetadata', setVideoDuration);

    return () => {
      currentVideo.removeEventListener('play', onPlay);
      currentVideo.removeEventListener('pause', onPause);
      currentVideo.removeEventListener('timeupdate', onTimeUpdate);
      currentVideo.removeEventListener('loadedmetadata', setVideoDuration);
    };
  }, [showIntro]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'f':
          toggleFullScreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'arrowright':
          if (videoRef.current) videoRef.current.currentTime += 5;
          break;
        case 'arrowleft':
          if (videoRef.current) videoRef.current.currentTime -= 5;
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!user) {
    return (
      <AnimatedPage className="h-full">
        <div className="h-full bg-dark-pure flex items-center justify-center px-6 font-sans">
          <div className="w-full max-w-lg border border-dark-border bg-dark-panel p-10 text-center">
            <p className="text-sm font-mono font-semibold uppercase tracking-widest text-zinc-200 leading-relaxed">
              Acesso restrito. Este caso só pode ser acessado por investigadores registrados.
            </p>
            <Link
              to="/login"
              state={{ from: `/video/${videoId}` }}
              className="inline-block mt-8 rounded-none bg-brand-primary text-black font-bold text-sm tracking-wider uppercase px-5 py-2.5 hover:opacity-90 transition-opacity"
            >
              Fazer login
            </Link>
          </div>
        </div>
      </AnimatedPage>
    );
  }

  if (loading) {
    return (
      <div className="bg-dark-pure text-white min-h-screen flex items-center justify-center font-sans">
        <LoadingSpinner />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="bg-dark-pure text-white min-h-screen flex items-center justify-center font-sans">
        <p className="text-zinc-400 font-mono text-sm tracking-wide">Vídeo não encontrado.</p>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="bg-dark-pure w-full h-full fixed inset-0 flex items-center justify-center z-50 overflow-hidden font-sans">
        {introStep === 1 ? (
          <div className={`text-center text-white p-4 animate-fade-in ${fadeOutFirstPart ? 'animate-fade-out' : ''}`}>
            <p className="text-2xl font-medium tracking-[0.2em] uppercase text-zinc-400">
              Dark Stream <span className="text-white">&</span> {video.creator_id?.username || 'Criador'}
            </p>
            <p className="text-sm font-mono text-zinc-500 mt-3 tracking-widest uppercase">Apresentam</p>
          </div>
        ) : (
          <div className={`text-center text-white p-4 animate-fade-in max-w-4xl ${fadeOutSecondPart ? 'animate-fade-out' : ''}`}>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-tight">{video.title}</h1>
          </div>
        )}
        <button
          onClick={() => setShowIntro(false)}
          className="absolute bottom-8 right-8 border border-dark-border text-white text-[11px] font-mono uppercase tracking-[0.15em] px-4 py-2 hover:bg-dark-panel transition-colors"
        >
          Pular intro
        </button>
      </div>
    );
  }

  const categories = formatCategories(video.category);

  return (
    <AnimatedPage className="h-full">
      <div className="h-full overflow-hidden bg-dark-pure text-white font-sans">
        <div className="h-full overflow-hidden grid grid-cols-12 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-1">

          {/* Player — 9 colunas no desktop */}
          <section className="col-span-12 lg:col-span-9 min-h-0 min-w-0 h-full flex flex-col bg-dark-pure overflow-hidden relative">
            {video.thumbnail && (
              <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <img
                  src={video.thumbnail}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover blur-[100px] opacity-30 scale-125"
                />
              </div>
            )}

            <div
              ref={playerContainerRef}
              className={`relative z-10 w-full h-full min-h-[50vh] lg:min-h-0 bg-black group ${
                !areControlsVisible && !videoRef.current?.paused ? 'cursor-none' : ''
              }`}
              onMouseMove={handleActivity}
              onMouseLeave={() => setAreControlsVisible(false)}
              onTouchStart={handleActivity}
            >
              <video
                ref={videoRef}
                onClick={togglePlayPause}
                onDoubleClick={toggleFullScreen}
                className="absolute inset-0 w-full h-full object-contain bg-black"
                src={video.videoUrl}
              />

              <div
                className={`absolute top-0 left-0 right-0 px-5 py-4 flex items-center gap-4 bg-gradient-to-b from-dark-pure/90 to-transparent transition-opacity duration-300 ${
                  chromeVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <button
                  onClick={() => navigate('/casos')}
                  className="flex items-center gap-2 text-white/80 hover:text-brand-primary border border-dark-border px-3 py-2 transition-colors"
                  title="Voltar ao catálogo"
                >
                  <BackIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[10px] font-mono uppercase tracking-widest hidden sm:inline">
                    Voltar ao catálogo
                  </span>
                </button>
              </div>

              <div
                className={`absolute inset-x-0 bottom-0 transition-opacity duration-300 ${
                  areControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <div className="bg-gradient-to-t from-dark-pure via-dark-pure/70 to-transparent pt-14">
                  <div className="px-4 pb-3">
                    <input
                      type="range"
                      min="0"
                      max={duration}
                      value={currentTime}
                      onChange={handleProgressChange}
                      className="w-full custom-range block"
                      aria-label="Progresso do vídeo"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 px-4 pb-4 min-h-[2rem]">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={togglePlayPause}
                        className="w-5 h-5 flex-shrink-0 text-white/90 hover:text-white"
                        aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
                      >
                        {isPlaying ? <PauseIcon /> : <PlayIcon />}
                      </button>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={toggleMute}
                          className="w-5 h-5 text-white/90 hover:text-white"
                          aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
                        >
                          {isMuted || volume === 0 ? <VolumeMuteIcon /> : <VolumeHighIcon />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-20 custom-range hidden sm:block"
                          aria-label="Volume"
                        />
                      </div>
                      <span className="text-[11px] font-mono text-white/60 tracking-wider whitespace-nowrap">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    <button
                      onClick={toggleFullScreen}
                      className="w-5 h-5 flex-shrink-0 text-white/90 hover:text-white"
                      aria-label="Tela cheia"
                    >
                      <FullscreenIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Painel lateral — 3 colunas no desktop */}
          <aside className="col-span-12 lg:col-span-3 min-h-0 flex flex-col overflow-hidden border-t lg:border-t-0 lg:border-l border-dark-border bg-dark-panel">
            <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-8 space-y-6">

              <header className="space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  Caso em exibição
                </p>
                <h1 className="text-2xl lg:text-[1.65rem] font-semibold leading-snug tracking-tight text-white">
                  {video.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
                  <span>
                    {new Date(video.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  {categories?.length > 0 && (
                    <>
                      <span className="text-zinc-700">|</span>
                      <span>{categories.join(' · ')}</span>
                    </>
                  )}
                </div>
              </header>

              <div className="flex items-center gap-4 py-4 border-y border-dark-border">
                <Link to={`/parceiro/${video.creator_id.id}`} className="flex-shrink-0">
                  <img
                    src={
                      video.creator_id.creatorAvatar
                      || `https://ui-avatars.com/api/?name=${video.creator_id.username.charAt(0)}&background=1a1a1a&color=fff`
                    }
                    alt={video.creator_id.username}
                    className="w-12 h-12 object-cover border border-dark-border"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/parceiro/${video.creator_id.id}`}
                    className="font-medium text-white hover:text-brand-primary transition-colors block truncate"
                  >
                    {video.creator_id.username}
                  </Link>
                  <p className="text-[11px] font-mono text-zinc-500 mt-0.5 uppercase tracking-wider">
                    {subscriberCount.toLocaleString('pt-BR')} seguidores
                  </p>
                </div>
                {user?.id !== video.creator_id.id && (
                  <button
                    onClick={handleFollowToggle}
                    disabled={isProcessingFollow}
                    className="flex-shrink-0 border border-dark-border text-white px-3 py-1 text-xs uppercase tracking-wider hover:bg-dark-border transition-colors disabled:opacity-50"
                  >
                    {isProcessingFollow ? '...' : isSubscribed ? 'Seguindo' : 'Seguir'}
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  Seu feedback
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleFeedbackVote(RECOMMEND_VOTE)}
                    disabled={isProcessingRating || Boolean(sessionVote)}
                    className={`text-[11px] font-mono uppercase tracking-widest px-3 py-3 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      sessionVote === RECOMMEND_VOTE
                        ? 'border-dark-border bg-dark-panel text-zinc-100'
                        : 'border-dark-border text-zinc-300 hover:border-zinc-500 hover:text-white'
                    }`}
                  >
                    Recomendar mais
                  </button>
                  <button
                    onClick={() => handleFeedbackVote(NOT_RECOMMEND_VOTE)}
                    disabled={isProcessingRating || Boolean(sessionVote)}
                    className={`text-[11px] font-mono uppercase tracking-widest px-3 py-3 border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      sessionVote === NOT_RECOMMEND_VOTE
                        ? 'border-dark-border bg-dark-panel text-zinc-300'
                        : 'border-dark-border text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    Não recomendar
                  </button>
                </div>
                {sessionVote && (
                  <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                    Feedback registrado nesta sessão.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  Sinopse
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {video.description || 'Nenhuma descrição fornecida.'}
                </p>
              </div>

              {updateShorts.length > 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                    Updates do caso
                  </p>
                  <div className="space-y-2">
                    {updateShorts.map((short) => (
                      <Link
                        to={`/video/${short.id}`}
                        key={short.id}
                        className="flex items-center gap-3 group border border-transparent hover:border-dark-border p-2 -mx-2 transition-colors"
                      >
                        <img
                          src={short.thumbnail}
                          alt={short.title}
                          className="w-20 h-11 object-cover flex-shrink-0 border border-dark-border"
                        />
                        <span className="text-sm text-zinc-300 group-hover:text-brand-primary line-clamp-2 leading-snug">
                          {short.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  Mais de {video.creator_id.username}
                </p>
                {relatedVideos.length > 0 ? (
                  <div className="space-y-2">
                    {relatedVideos.map((related) => (
                      <Link
                        to={`/video/${related.id}`}
                        key={related.id}
                        className="flex items-center gap-3 group border border-transparent hover:border-dark-border p-2 -mx-2 transition-colors"
                      >
                        <img
                          src={related.thumbnail}
                          alt={related.title}
                          className="w-20 h-11 object-cover flex-shrink-0 border border-dark-border"
                        />
                        <div className="min-w-0">
                          <p className="text-sm text-zinc-300 group-hover:text-brand-primary line-clamp-2 leading-snug">
                            {related.title}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-600 mt-1 uppercase tracking-wider">
                            {related.creator_id?.username}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-zinc-600 font-mono">Nenhum outro caso deste parceiro.</p>
                )}
              </div>

            </div>
          </aside>

        </div>
      </div>
    </AnimatedPage>
  );
}
