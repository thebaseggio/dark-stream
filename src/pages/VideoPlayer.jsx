// src/pages/VideoPlayer.jsx

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import RestrictedAccessScreen from '../components/RestrictedAccessScreen';
import PlayerAmbientGlow from '../components/PlayerAmbientGlow';
import TheoryForum from '../components/TheoryForum';
import CaseFilesPanel from '../components/CaseFilesPanel';
import SiteContainer from '../components/SiteContainer';
import SeoHead, { buildMetaDescription, buildVideoPageTitle } from '../components/SeoHead';
import { getPartnerProfilePath } from '../utils/partnerProfile';
import {
  checkPartnerFollowStatus,
  fetchPartnerFollowerCount,
  formatFollowerLabel,
  togglePartnerFollow,
} from '../utils/subscriptions';
import {
  FEEDBACK_LIKE,
  FEEDBACK_DISLIKE,
  saveUserFeedback,
  saveLocalFeedback,
} from '../utils/userFeedback';
import { registerVideoView, normalizeVideoViews } from '../utils/videoViews';
import {
  readVideoProgress,
  saveVideoProgress,
} from '../utils/videoPlayback';

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
const ExitFullscreenIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
);
const TheaterIcon = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M18 4v3H6V4H4v16h2v-3h12v3h2V4h-2z" /></svg>
);

const ACTION_OVERLAY_MS = 600;

const ACTION_OVERLAY_ICONS = {
  mute: VolumeMuteIcon,
  unmute: VolumeHighIcon,
  'fullscreen-enter': FullscreenIcon,
  'fullscreen-exit': ExitFullscreenIcon,
};

function PlayerActionOverlay({ overlay }) {
  if (!overlay) return null;

  const Icon = overlay.icon ? ACTION_OVERLAY_ICONS[overlay.icon] : null;
  const isCenter = overlay.placement === 'center';

  return (
    <div
      key={overlay.id}
      className={`pointer-events-none absolute z-30 ${
        isCenter
          ? 'inset-0 flex items-center justify-center'
          : overlay.placement === 'seek-back'
            ? 'left-[16%] top-1/2 -translate-y-1/2'
            : 'right-[16%] top-1/2 -translate-y-1/2'
      }`}
    >
      <div
        className={`animate-action-overlay flex flex-col items-center justify-center gap-1.5 rounded-full border border-zinc-800 bg-black/75 text-brand-primary backdrop-blur-sm ${
          isCenter ? 'p-5' : 'h-20 w-20'
        }`}
      >
        {Icon && <Icon className="h-8 w-8 flex-shrink-0" />}
        {overlay.text && (
          <span className={`font-mono uppercase tracking-widest text-brand-primary ${
            Icon ? 'text-[10px]' : 'text-sm font-semibold tracking-wide'
          }`}
          >
            {overlay.text}
          </span>
        )}
      </div>
    </div>
  );
}
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

function getShortTypeLabel(shortType) {
  if (shortType === 'intro') return 'Prévia';
  if (shortType === 'flash') return 'Flash';
  return 'Atualização';
}

function getEndCardShort(shorts = []) {
  if (!shorts.length) return null;
  const sequels = shorts.filter((short) => short.short_type !== 'intro');
  return sequels.length ? sequels[sequels.length - 1] : shorts[shorts.length - 1];
}

function getAutoplayTarget(video, updateShorts) {
  const linkedShort = getEndCardShort(updateShorts);
  if (linkedShort?.id) return linkedShort;

  if (video?.parent_video_id) {
    return {
      id: video.parent_video_id,
      title: 'Caso principal vinculado',
      thumbnail: video.thumbnail,
      short_type: null,
    };
  }

  return null;
}

const END_AUTOPLAY_SECONDS = 15;
const AUTOPLAY_NEXT_KEY = 'darkstream:autoplay-next';
const SEEK_STEP_SECONDS = 10;
const VOLUME_STEP = 0.05;

function isEditableElement(element) {
  if (!element || !(element instanceof HTMLElement)) return false;
  const tag = element.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return element.isContentEditable;
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
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const [introStep, setIntroStep] = useState(1);
  const [fadeOutFirstPart, setFadeOutFirstPart] = useState(false);
  const [fadeOutSecondPart, setFadeOutSecondPart] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [floatingDismissed, setFloatingDismissed] = useState(false);
  const [endAutoplayActive, setEndAutoplayActive] = useState(false);
  const [endAutoplayTarget, setEndAutoplayTarget] = useState(null);
  const [endAutoplaySeconds, setEndAutoplaySeconds] = useState(END_AUTOPLAY_SECONDS);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [playerOverlay, setPlayerOverlay] = useState(null);
  const [timelineHover, setTimelineHover] = useState(null);

  const inactivityTimerRef = useRef(null);
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const playerSurfaceRef = useRef(null);
  const timelineTrackRef = useRef(null);
  const actionOverlayTimerRef = useRef(null);
  const playerWasFullscreenRef = useRef(false);
  const floatingDismissedRef = useRef(false);
  const lastPlaybackSaveRef = useRef(0);
  const videoDataRef = useRef(null);
  const hasRestoredProgressRef = useRef(false);
  const hasStartedPlaybackRef = useRef(false);
  const hasLoadedVideoRef = useRef(false);

  useEffect(() => {
    videoDataRef.current = video;
  }, [video]);

  const handleTimeUpdate = useCallback((e) => {
    const el = e.currentTarget;
    setCurrentTime(el.currentTime);
    setProgress((el.currentTime / el.duration) * 100 || 0);

    const now = Date.now();
    if (videoId && now - lastPlaybackSaveRef.current > 2000) {
      lastPlaybackSaveRef.current = now;
      saveVideoProgress(user?.id, videoId, el.currentTime);
    }
  }, [videoId, user?.id]);

  // Espelham o estado nativo do <video>; nunca disparam .play()/.pause() imperativos.
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
    setIsFloating(false);

    const target = getAutoplayTarget(videoDataRef.current, updateShorts);
    if (!target?.id) return;

    setEndAutoplayTarget(target);
    setEndAutoplaySeconds(END_AUTOPLAY_SECONDS);
    setEndAutoplayActive(true);
  }, [updateShorts]);

  const handleDurationChange = useCallback((e) => {
    const el = e.currentTarget;
    if (Number.isFinite(el.duration)) {
      setDuration(el.duration);
    }
  }, []);

  const handleLoadedData = useCallback((e) => {
    if (hasRestoredProgressRef.current) return;

    const el = e.currentTarget;
    const savedTime = readVideoProgress(user?.id, videoId);
    if (savedTime > 0 && el.currentTime < 1) {
      el.currentTime = savedTime;
      setCurrentTime(savedTime);
      setProgress((savedTime / el.duration) * 100 || 0);
      hasRestoredProgressRef.current = true;
    }
  }, [videoId, user?.id]);

  const togglePlayPause = useCallback(() => {
    const currentVideo = videoRef.current;
    if (!currentVideo) return;
    if (currentVideo.paused) {
      currentVideo.play().catch(() => setIsPlaying(false));
    } else {
      currentVideo.pause();
    }
  }, []);

  const showActionOverlay = useCallback((overlay) => {
    const overlayId = Date.now();
    setPlayerOverlay({ ...overlay, id: overlayId });
    if (actionOverlayTimerRef.current) clearTimeout(actionOverlayTimerRef.current);
    actionOverlayTimerRef.current = window.setTimeout(() => {
      setPlayerOverlay((current) => (current?.id === overlayId ? null : current));
    }, ACTION_OVERLAY_MS);
  }, []);

  const toggleMute = useCallback(() => {
    const currentVideo = videoRef.current;
    if (!currentVideo) return;
    currentVideo.muted = !currentVideo.muted;
    setIsMuted(currentVideo.muted);
    if (!currentVideo.muted && currentVideo.volume === 0) {
      currentVideo.volume = 1;
      setVolume(1);
    }
    showActionOverlay({
      placement: 'center',
      icon: currentVideo.muted ? 'mute' : 'unmute',
      text: currentVideo.muted ? 'Mudo' : null,
    });
  }, [showActionOverlay]);

  const handleVolumeChange = useCallback((e) => {
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
  }, []);

  const handleProgressChange = useCallback((e) => {
    const currentVideo = videoRef.current;
    if (!currentVideo) return;
    const newTime = parseFloat(e.target.value);
    currentVideo.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / currentVideo.duration) * 100 || 0);
  }, []);

  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) playerSurfaceRef.current?.requestFullscreen();
    else document.exitFullscreen();
  }, []);

  const seekBySeconds = useCallback((delta) => {
    const currentVideo = videoRef.current;
    if (!currentVideo) return;
    const maxTime = Number.isFinite(currentVideo.duration) ? currentVideo.duration : 0;
    const nextTime = Math.max(0, Math.min(maxTime, currentVideo.currentTime + delta));
    currentVideo.currentTime = nextTime;
    setCurrentTime(nextTime);
    setProgress((nextTime / currentVideo.duration) * 100 || 0);
    showActionOverlay({
      placement: delta < 0 ? 'seek-back' : 'seek-forward',
      text: delta < 0 ? '-10s' : '+10s',
    });
  }, [showActionOverlay]);

  const adjustVolume = useCallback((delta) => {
    const currentVideo = videoRef.current;
    if (!currentVideo) return;
    const nextVolume = Math.max(0, Math.min(1, currentVideo.volume + delta));
    currentVideo.volume = nextVolume;
    setVolume(nextVolume);
    if (nextVolume === 0) {
      currentVideo.muted = true;
      setIsMuted(true);
    } else if (currentVideo.muted) {
      currentVideo.muted = false;
      setIsMuted(false);
    }
  }, []);

  const toggleTheaterMode = useCallback(() => {
    setIsTheaterMode((current) => !current);
  }, []);

  const handleTimelineMouseMove = useCallback((e) => {
    const track = timelineTrackRef.current;
    const currentVideo = videoRef.current;
    if (!track || !currentVideo || !Number.isFinite(currentVideo.duration) || currentVideo.duration <= 0) {
      return;
    }

    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    setTimelineHover({ time: ratio * currentVideo.duration, x });
  }, []);

  const handleTimelineMouseLeave = useCallback(() => {
    setTimelineHover(null);
  }, []);

  const handleFollowToggle = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/video/${videoId}` } });
      return;
    }

    const creatorId = video?.creator_id?.id;
    if (!creatorId || user.id === creatorId) return;

    setIsProcessingFollow(true);

    try {
      const nextFollowing = await togglePartnerFollow(
        supabase,
        user.id,
        creatorId,
        isSubscribed
      );
      setIsSubscribed(nextFollowing);

      const updatedCount = await fetchPartnerFollowerCount(supabase, creatorId);
      setSubscriberCount(updatedCount);
    } catch {
      setIsSubscribed(false);
    } finally {
      setIsProcessingFollow(false);
    }
  };

  const handleActivity = useCallback(() => {
    reportChromeActivity?.();
    setAreControlsVisible(true);
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      const currentVideo = videoRef.current;
      if (currentVideo && !currentVideo.paused && !currentVideo.muted) {
        setAreControlsVisible(false);
      }
    }, 3000);
  }, [reportChromeActivity]);

  const handleWatchEndCardShort = useCallback(() => {
    const short = getEndCardShort(updateShorts);
    if (!short?.id) return;
    sessionStorage.setItem(AUTOPLAY_NEXT_KEY, '1');
    navigate(`/video/${short.id}`);
  }, [navigate, updateShorts]);

  const handleNavigateAutoplayTarget = useCallback((targetId) => {
    if (!targetId) return;
    setEndAutoplayActive(false);
    setEndAutoplayTarget(null);
    sessionStorage.setItem(AUTOPLAY_NEXT_KEY, '1');
    navigate(`/video/${targetId}`);
  }, [navigate]);

  const handleCancelEndAutoplay = useCallback(() => {
    setEndAutoplayActive(false);
    setEndAutoplayTarget(null);
    setEndAutoplaySeconds(END_AUTOPLAY_SECONDS);
  }, []);

  const handleCloseFloatingPlayer = useCallback(() => {
    floatingDismissedRef.current = true;
    setFloatingDismissed(true);
    setIsFloating(false);
    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const endCardShort = useMemo(() => getEndCardShort(updateShorts), [updateShorts]);

  const showEndCard = useMemo(() => {
    if (!endCardShort || !Number.isFinite(duration) || duration <= 0) return false;
    const remaining = duration - currentTime;
    return remaining <= 15 && remaining > 0;
  }, [endCardShort, duration, currentTime]);

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
    const preferenceRating = voteType === RECOMMEND_VOTE ? FEEDBACK_LIKE : FEEDBACK_DISLIKE;

    const [{ error }, preferenceResult] = await Promise.all([
      supabase.rpc('increment_video_feedback', {
        video_row_id: videoId,
        feedback_type: feedbackType,
      }),
      user
        ? saveUserFeedback(user.id, videoId, preferenceRating)
        : Promise.resolve({ error: null }),
    ]);

    if (error) {
      console.error('Erro ao registrar feedback:', error);
    } else {
      sessionStorage.setItem(getSessionVoteKey(videoId), voteType);
      saveLocalFeedback(videoId, preferenceRating);
      setSessionVote(voteType);
      setVideo((prev) => ({
        ...prev,
        [feedbackType]: (prev?.[feedbackType] || 0) + 1,
      }));
    }

    if (preferenceResult?.error) {
      console.error('Erro ao salvar preferência do usuário:', preferenceResult.error);
    }

    setIsProcessingRating(false);
  };

  useEffect(() => {
    setShowIntro(true);
    setIntroStep(1);
    setFadeOutFirstPart(false);
    setFadeOutSecondPart(false);
    setIsPlaying(false);
    setDuration(0);
    setVolume(0.8);
    setIsMuted(false);
    setAreControlsVisible(true);
    lastPlaybackSaveRef.current = 0;
    hasRestoredProgressRef.current = false;
    hasStartedPlaybackRef.current = false;
    hasLoadedVideoRef.current = false;
    setIsFloating(false);
    setFloatingDismissed(false);
    floatingDismissedRef.current = false;
    setEndAutoplayActive(false);
    setEndAutoplayTarget(null);
    setEndAutoplaySeconds(END_AUTOPLAY_SECONDS);

    const savedTime = readVideoProgress(user?.id, videoId);
    setCurrentTime(savedTime);
    setProgress(0);
  }, [videoId, user?.id]);

  useEffect(() => {
    const userId = user?.id;
    if (!videoId || !userId) return;

    const isInitialLoad = !hasLoadedVideoRef.current;

    const fetchData = async () => {
      if (isInitialLoad) setLoading(true);

      try {
        const { data: videoData, error: videoError } = await supabase
          .from('videos')
          .select('*, creator_id (id, username, creatorAvatar)')
          .eq('id', videoId)
          .single();

        if (videoError || !videoData) {
          console.error('Erro ao buscar vídeo:', videoError);
          return;
        }

        setVideo(videoData);
        hasLoadedVideoRef.current = true;
        const creatorId = videoData.creator_id?.id;

        if (!creatorId) {
          setSubscriberCount(0);
          setIsSubscribed(false);
          setSessionVote(readSessionVote(videoId));
          setUpdateShorts([]);
          return;
        }

        const [subscriberCountResult, followingResult, shortsRes] = await Promise.all([
          fetchPartnerFollowerCount(supabase, creatorId),
          userId !== creatorId
            ? checkPartnerFollowStatus(supabase, userId, creatorId)
            : Promise.resolve(false),
          supabase
            .from('videos')
            .select('id, title, thumbnail, short_type, created_at')
            .eq('parent_video_id', videoId)
            .eq('is_short', true)
            .order('created_at', { ascending: true }),
        ]);

        setSubscriberCount(subscriberCountResult);
        setIsSubscribed(followingResult);
        setSessionVote(readSessionVote(videoId));
        setUpdateShorts(shortsRes.data || []);
      } catch {
        setSubscriberCount(0);
        setIsSubscribed(false);
      } finally {
        if (isInitialLoad) setLoading(false);
      }
    };

    fetchData();
  }, [videoId, user?.id]);

  useEffect(() => {
    if (!videoId || !user) return;

    const registerView = async () => {
      const result = await registerVideoView(supabase, {
        videoId,
        userId: user?.id,
        fallbackViews: videoDataRef.current?.views,
      });

      if (result.ok && !result.skipped && result.views != null) {
        setVideo((prev) => (prev ? { ...prev, views: result.views } : prev));
      } else if (result.ok && result.method === 'rpc') {
        setVideo((prev) => (
          prev
            ? { ...prev, views: normalizeVideoViews(prev.views) + 1 }
            : prev
        ));
      }
    };

    const timer = setTimeout(registerView, 2000);
    return () => clearTimeout(timer);
  }, [videoId, user?.id]);

  useEffect(() => {
    const creatorId = video?.creator_id?.id;
    if (!creatorId) return;

    const fetchRelated = async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, thumbnail, creator_id(username)')
        .eq('creator_id', creatorId)
        .eq('is_short', false)
        .is('parent_video_id', null)
        .neq('id', videoId)
        .limit(5);

      if (error) console.error('Erro ao buscar vídeos relacionados:', error);
      else setRelatedVideos(data);
    };

    fetchRelated();
  }, [video?.creator_id?.id, videoId]);

  useEffect(() => {
    if (!loading && video?.id && sessionStorage.getItem(AUTOPLAY_NEXT_KEY) === '1') {
      setShowIntro(false);
      setIntroStep(2);
    }
  }, [loading, video?.id]);

  useEffect(() => {
    if (!loading && video?.id) {
      const t1 = setTimeout(() => setFadeOutFirstPart(true), 3500);
      const t2 = setTimeout(() => setIntroStep(2), 4000);
      const t3 = setTimeout(() => setFadeOutSecondPart(true), 7500);
      const t4 = setTimeout(() => setShowIntro(false), 8000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
  }, [loading, video?.id]);

  useEffect(() => {
    const currentVideo = videoRef.current;
    if (showIntro !== false || !currentVideo || hasStartedPlaybackRef.current) return;

    hasStartedPlaybackRef.current = true;

    const savedTime = readVideoProgress(user?.id, videoId);
    if (savedTime > 0 && currentVideo.currentTime < 1) {
      currentVideo.currentTime = savedTime;
      setCurrentTime(savedTime);
      setProgress((savedTime / currentVideo.duration) * 100 || 0);
      hasRestoredProgressRef.current = true;
    }

    currentVideo.volume = 0.8;
    currentVideo.muted = false;
    setVolume(0.8);
    setIsMuted(false);

    const shouldAutoplayNext = sessionStorage.getItem(AUTOPLAY_NEXT_KEY) === '1';
    if (shouldAutoplayNext) {
      sessionStorage.removeItem(AUTOPLAY_NEXT_KEY);
    }

    const playPromise = currentVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => setIsPlaying(false));
    }
  }, [showIntro, videoId, user?.id]);

  useEffect(() => {
    floatingDismissedRef.current = floatingDismissed;
  }, [floatingDismissed]);

  useEffect(() => {
    if (videoRef.current) {
      const wasPlaying = !videoRef.current.paused;
      if (wasPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isFloating]);

  useEffect(() => {
    if (showIntro) return undefined;

    const handleScroll = () => {
      if (!playerRef.current) return;
      const rect = playerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

      if (
        !floatingDismissedRef.current
        && (rect.bottom < 0 || scrollY > 400)
      ) {
        setIsFloating(true);
      } else if (rect.top >= 0 && scrollY <= 400) {
        setIsFloating(false);
        setFloatingDismissed(false);
        floatingDismissedRef.current = false;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [showIntro]);

  useEffect(() => {
    if (!endAutoplayActive || !endAutoplayTarget?.id) return undefined;

    if (endAutoplaySeconds <= 0) {
      handleNavigateAutoplayTarget(endAutoplayTarget.id);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setEndAutoplaySeconds((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [endAutoplayActive, endAutoplayTarget, endAutoplaySeconds, handleNavigateAutoplayTarget]);

  // Backup passivo do progresso ao sair da aba — sem tocar em play/pause ou recarregar mídia.
  useEffect(() => {
    const persistProgressOnHide = () => {
      if (!document.hidden) return;
      const el = videoRef.current;
      if (!el || !videoId) return;
      saveVideoProgress(user?.id, videoId, el.currentTime);
      lastPlaybackSaveRef.current = Date.now();
    };

    document.addEventListener('visibilitychange', persistProgressOnHide);
    return () => document.removeEventListener('visibilitychange', persistProgressOnHide);
  }, [videoId, user?.id]);

  useEffect(() => {
    if (showIntro) return undefined;

    const handleKeyDown = (e) => {
      if (isEditableElement(e.target) || isEditableElement(document.activeElement)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'f':
          toggleFullScreen();
          break;
        case 'm':
          toggleMute();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          seekBySeconds(-SEEK_STEP_SECONDS);
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          seekBySeconds(SEEK_STEP_SECONDS);
          break;
        case 'arrowup':
          e.preventDefault();
          adjustVolume(VOLUME_STEP);
          break;
        case 'arrowdown':
          e.preventDefault();
          adjustVolume(-VOLUME_STEP);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIntro, togglePlayPause, toggleFullScreen, toggleMute, seekBySeconds, adjustVolume]);

  useEffect(() => () => {
    if (actionOverlayTimerRef.current) clearTimeout(actionOverlayTimerRef.current);
  }, []);

  useEffect(() => {
    if (showIntro) return undefined;

    const handleFullscreenChange = () => {
      const isPlayerFullscreen = document.fullscreenElement === playerSurfaceRef.current;

      if (isPlayerFullscreen && !playerWasFullscreenRef.current) {
        showActionOverlay({ placement: 'center', icon: 'fullscreen-enter' });
      } else if (!isPlayerFullscreen && playerWasFullscreenRef.current) {
        showActionOverlay({ placement: 'center', icon: 'fullscreen-exit' });
      }

      playerWasFullscreenRef.current = isPlayerFullscreen;
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [showIntro, showActionOverlay]);

  if (!user) {
    return (
      <AnimatedPage className="h-full">
        <RestrictedAccessScreen
          caseId={videoId}
          loginState={{ from: `/video/${videoId}` }}
        />
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
        <SeoHead title="Caso não encontrado | Dark Stream" noIndex />
        <p className="text-zinc-400 font-mono text-sm tracking-wide">Vídeo não encontrado.</p>
      </div>
    );
  }

  const videoSeoTitle = buildVideoPageTitle(video.title);
  const videoSeoDescription = buildMetaDescription(video.description);
  const videoSeoImage = video.thumbnail;
  const partnerProfilePath =
    getPartnerProfilePath(video.creator_id) || `/parceiro/${video.creator_id?.id}`;

  if (showIntro) {
    return (
      <div className="bg-dark-pure w-full h-full fixed inset-0 flex items-center justify-center z-50 overflow-hidden font-sans">
        <SeoHead
          title={videoSeoTitle}
          description={videoSeoDescription}
          image={videoSeoImage}
          type="video.other"
        />
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

  const renderVideoSurface = (floating) => (
    <div className={floating ? 'relative w-full h-full min-h-[8rem] overflow-hidden' : 'contents'}>
      {floating && (
        <button
          type="button"
          onClick={handleCloseFloatingPlayer}
          className="absolute top-2 right-2 z-40 w-7 h-7 flex items-center justify-center rounded-full bg-black/80 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          aria-label="Fechar mini player e voltar ao topo"
        >
          ✕
        </button>
      )}
      <video
        key={videoId}
        ref={videoRef}
        playsInline
        onClick={togglePlayPause}
        onDoubleClick={toggleFullScreen}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleVideoEnded}
        onDurationChange={handleDurationChange}
        onLoadedMetadata={handleDurationChange}
        onLoadedData={handleLoadedData}
        className={
          floating
            ? 'relative z-0 block w-full h-full min-h-[8rem] object-cover bg-black'
            : 'absolute inset-0 z-0 w-full h-full object-contain bg-black'
        }
        src={video.videoUrl}
      />

      <PlayerActionOverlay overlay={playerOverlay} />

      {!floating && (
        <div
          className={`absolute top-0 left-0 w-full z-20 px-5 py-4 flex items-center gap-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent transition-all duration-500 ease-in-out ${
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
      )}

      <div
        className={`absolute bottom-0 left-0 w-full z-20 transition-all duration-500 ease-in-out ${
          areControlsVisible || floating ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"
          aria-hidden="true"
        />
        <div className={`relative z-10 pb-1 ${floating ? 'pt-2' : 'pt-12'}`}>
          <div
            ref={timelineTrackRef}
            className="player-timeline-track relative px-4"
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={handleTimelineMouseLeave}
          >
            {timelineHover && (
              <div
                className="pointer-events-none absolute bottom-full z-30 mb-2 -translate-x-1/2"
                style={{ left: `${timelineHover.x}px` }}
              >
                <div className="whitespace-nowrap rounded border border-brand-primary/50 bg-black/95 px-2.5 py-1 text-[11px] font-mono tracking-wider text-brand-primary shadow-lg shadow-black/60">
                  {formatTime(timelineHover.time)}
                </div>
              </div>
            )}
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleProgressChange}
              style={{ '--range-progress': `${progress}%` }}
              className="custom-range custom-range--timeline block w-full"
              aria-label="Progresso do vídeo"
            />
          </div>

          <div className="flex items-center justify-between gap-4 px-4 pb-4 pt-2 min-h-[2rem] transition-opacity duration-500 ease-in-out">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={togglePlayPause}
                className="w-5 h-5 flex-shrink-0 text-white/90 hover:text-brand-primary transition-colors duration-300"
                aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              {!floating && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={toggleMute}
                    className="w-5 h-5 text-white/90 hover:text-brand-primary transition-colors duration-300"
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
              )}
              <span className="text-[11px] font-mono text-white/60 tracking-wider whitespace-nowrap">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            {!floating && (
              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheaterMode}
                  className={`h-5 w-5 transition-colors duration-300 ${
                    isTheaterMode ? 'text-brand-primary' : 'text-white/90 hover:text-brand-primary'
                  }`}
                  aria-label={isTheaterMode ? 'Sair do modo cinema' : 'Modo cinema'}
                  aria-pressed={isTheaterMode}
                >
                  <TheaterIcon className="h-full w-full" />
                </button>
                <button
                  onClick={toggleFullScreen}
                  className="h-5 w-5 flex-shrink-0 text-white/90 transition-colors duration-300 hover:text-brand-primary"
                  aria-label="Tela cheia"
                >
                  <FullscreenIcon />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {!floating && endCardShort && (
        <div
          className={`absolute bottom-24 right-4 sm:right-6 z-30 w-[min(calc(100%-2rem),340px)] transition-all duration-500 ease-in-out ${
            showEndCard && !endAutoplayActive
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          aria-hidden={!showEndCard}
        >
          <div className="border border-dark-border/80 bg-black/85 backdrop-blur-md shadow-2xl shadow-black/60 p-3 sm:p-4">
            <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 mb-2">
              Próximo no caso
            </p>
            <div className="flex gap-3">
              <div className="relative flex-shrink-0 w-16 h-24 sm:w-[4.5rem] sm:h-28 overflow-hidden border border-dark-border">
                <img
                  src={endCardShort.thumbnail}
                  alt={endCardShort.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-between gap-2">
                <div>
                  <span className="inline-block text-[9px] font-mono uppercase tracking-widest text-[#f1c40f] bg-[#8e44ad]/20 border border-[#8e44ad]/30 px-2 py-0.5 mb-1.5">
                    Atualização
                  </span>
                  <p className="text-sm text-white leading-snug line-clamp-2">
                    {endCardShort.title}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleWatchEndCardShort}
                  className="self-start bg-brand-primary text-black text-[10px] font-mono uppercase tracking-widest px-3 py-2 hover:opacity-90 transition-opacity"
                >
                  Assistir Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!floating && endAutoplayActive && endAutoplayTarget && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/90 p-4 sm:p-6">
          <div className="w-full max-w-md border border-zinc-800 bg-zinc-950/95 backdrop-blur-sm shadow-2xl p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">
                Reprodução automática
              </p>
              <h3 className="text-lg text-white leading-snug line-clamp-2">
                {endAutoplayTarget.title}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                <span>Próximo caso em</span>
                <span className="text-brand-primary">{endAutoplaySeconds}s</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-brand-primary transition-all duration-1000 ease-linear"
                  style={{ width: `${(endAutoplaySeconds / END_AUTOPLAY_SECONDS) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelEndAutoplay}
                className="flex-1 border border-zinc-700 px-3 py-2.5 text-[10px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleNavigateAutoplayTarget(endAutoplayTarget.id)}
                className="flex-1 bg-brand-primary text-black px-3 py-2.5 text-[10px] font-mono uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Assistir agora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-full">
      <SeoHead
        title={videoSeoTitle}
        description={videoSeoDescription}
        image={videoSeoImage}
        type="video.other"
      />
      <div className={`min-h-full bg-dark-pure text-white font-sans flex flex-col ${isTheaterMode ? 'bg-black' : ''}`}>
        {isTheaterMode && !isFloating && (
          <div
            className="pointer-events-none fixed inset-0 z-[8] bg-black/80 transition-opacity duration-500"
            aria-hidden="true"
          />
        )}
        <div className={`relative flex-shrink-0 ${isTheaterMode && !isFloating ? 'z-[15]' : ''}`}>
          <PlayerAmbientGlow thumbnail={video.thumbnail} />

          {/* Player em modo cinema — sem transform/overflow nos pais do surface */}
          <section
            className={`w-full flex-shrink-0 bg-black transition-all duration-500 ${
              isTheaterMode && !isFloating ? 'shadow-2xl shadow-black' : ''
            }`}
          >
            <div
              ref={playerRef}
              className={`relative w-full transition-all duration-500 ${
                isTheaterMode && !isFloating
                  ? 'h-[min(56.25vw,85vh)] min-h-[420px]'
                  : 'h-[450px] md:h-[600px] lg:h-[min(56.25vw,85vh)]'
              }`}
            >
              {isFloating && (
                <div className="absolute inset-0 bg-black/90" aria-hidden="true" />
              )}
              <div
                ref={playerSurfaceRef}
                className={
                  isFloating
                    ? 'fixed bottom-6 right-6 w-80 md:w-96 z-[99999] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-slide-up pointer-events-auto aspect-video'
                    : `absolute inset-0 bg-black/90 overflow-hidden group ${
                        !areControlsVisible && isPlaying ? 'cursor-none' : ''
                      }`
                }
                onMouseMove={handleActivity}
                onMouseLeave={() => {
                  if (!isFloating) setAreControlsVisible(false);
                }}
                onTouchStart={handleActivity}
              >
                {renderVideoSurface(isFloating)}
              </div>
            </div>
          </section>
        </div>

        {/* Conteúdo abaixo do player */}
        <SiteContainer
          className={`relative z-10 py-8 lg:py-10 transition-all duration-500 ${
            isTheaterMode && !isFloating
              ? 'pointer-events-none select-none opacity-25 blur-[1px]'
              : ''
          }`}
        >
          <div className="grid grid-cols-12 gap-8 lg:gap-10">
            <div className="col-span-12 lg:col-span-8 space-y-8">
              <header className="space-y-3">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  Caso em exibição
                </p>
                <h1 className="text-2xl lg:text-3xl font-semibold leading-snug tracking-tight text-white">
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
                <Link
                  to={partnerProfilePath}
                  className="flex items-center gap-4 flex-1 min-w-0 group"
                >
                  <img
                    src={
                      video.creator_id.creatorAvatar
                      || `https://ui-avatars.com/api/?name=${video.creator_id.username.charAt(0)}&background=1a1a1a&color=fff`
                    }
                    alt={video.creator_id.username}
                    className="w-12 h-12 object-cover border border-dark-border group-hover:border-brand-primary transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-white group-hover:text-brand-primary transition-colors block truncate">
                      {video.creator_id.username}
                    </span>
                    <p className="text-[11px] font-mono text-zinc-500 mt-0.5 uppercase tracking-wider">
                      {formatFollowerLabel(subscriberCount)}
                    </p>
                    <p className="text-[10px] font-mono text-zinc-600 mt-1 uppercase tracking-widest group-hover:text-zinc-400 transition-colors">
                      Ver canal do parceiro
                    </p>
                  </div>
                </Link>
                {user?.id !== video.creator_id.id && (
                  <button
                    type="button"
                    onClick={handleFollowToggle}
                    disabled={isProcessingFollow}
                    className={`flex-shrink-0 border px-3 py-1 text-xs uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      isSubscribed
                        ? 'border-brand-primary/60 text-brand-primary hover:border-brand-primary'
                        : 'border-dark-border text-white hover:bg-dark-border'
                    }`}
                  >
                    {isProcessingFollow ? '…' : isSubscribed ? 'Seguindo' : 'Seguir'}
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

              <CaseFilesPanel videoId={videoId} />

              {updateShorts.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      Atualizações e Shorts deste Caso
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      {updateShorts.length} {updateShorts.length === 1 ? 'short vinculado' : 'shorts vinculados'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {updateShorts.map((short) => (
                      <Link
                        to={`/video/${short.id}`}
                        key={short.id}
                        className="flex items-center gap-3 group border border-dark-border bg-black/30 hover:border-[#8e44ad]/50 hover:bg-[#121212] p-3 transition-all duration-300"
                      >
                        <div className="relative flex-shrink-0 w-14 h-20 overflow-hidden border border-dark-border">
                          <img
                            src={short.thumbnail}
                            alt={short.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="inline-block text-[9px] font-mono uppercase tracking-widest text-[#f1c40f] bg-[#8e44ad]/20 border border-[#8e44ad]/30 px-2 py-0.5 mb-1.5">
                            {getShortTypeLabel(short.short_type)}
                          </span>
                          <p className="text-sm text-zinc-300 group-hover:text-brand-primary line-clamp-2 leading-snug transition-colors">
                            {short.title}
                          </p>
                        </div>
                        <span className="text-zinc-600 group-hover:text-[#f1c40f] transition-colors" aria-hidden="true">
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <TheoryForum videoId={videoId} user={user} />
            </div>

            <aside className="col-span-12 lg:col-span-4">
              <div className="lg:sticky lg:top-24 space-y-4 border border-dark-border bg-dark-panel p-6">
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
                          className="w-24 h-14 object-cover flex-shrink-0 border border-dark-border"
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
            </aside>
          </div>
        </SiteContainer>
      </div>
    </div>
  );
}