const INTRO_SOUND_SRC = '/intro-cinematic-hit.mp3';
const DEFAULT_INTRO_VOLUME = 0.62;
const INTRO_FADE_IN_MS = 220;
const INTRO_MAX_DURATION_MS = 1500;
const INTRO_AUTO_FADE_OUT_MS = 360;
const INTRO_AUTO_FADE_START_MS = INTRO_MAX_DURATION_MS - INTRO_AUTO_FADE_OUT_MS;
const DEFAULT_FADE_OUT_MS = 220;

const SYNTH_START_FREQ_HZ = 150;
const SYNTH_END_FREQ_HZ = 45;
const SYNTH_PEAK_GAIN = 0.45;

let introAudio = null;
let introAudioContext = null;
let introSourceMode = null;
let introSourceProbePromise = null;
let activeSession = null;
let fadeFrameId = null;
let autoFadeTimerId = null;
let autoStopTimerId = null;
let audioUnlockListenerAttached = false;

function getIntroAudio() {
  if (typeof window === 'undefined') return null;

  if (!introAudio) {
    introAudio = new Audio(INTRO_SOUND_SRC);
    introAudio.preload = 'auto';
  }

  return introAudio;
}

function getAudioContextClass() {
  if (typeof window === 'undefined') return null;
  return window.AudioContext || window.webkitAudioContext || null;
}

function getOrCreateAudioContext() {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return null;

  if (!introAudioContext || introAudioContext.state === 'closed') {
    introAudioContext = new AudioContextClass();
  }

  return introAudioContext;
}

export async function unlockAudioContext() {
  const context = getOrCreateAudioContext();
  if (!context) {
    return { ok: false, state: 'unavailable' };
  }

  try {
    if (context.state === 'suspended') {
      await context.resume();
    }
    return { ok: context.state === 'running', state: context.state };
  } catch {
    return { ok: false, state: context.state };
  }
}

function attachGlobalAudioUnlockListener() {
  if (typeof window === 'undefined' || audioUnlockListenerAttached) return;
  audioUnlockListenerAttached = true;

  const handleFirstInteraction = () => {
    void unlockAudioContext();
  };

  window.addEventListener('click', handleFirstInteraction, { once: true, capture: true });
  window.addEventListener('touchstart', handleFirstInteraction, { once: true, capture: true, passive: true });
}

attachGlobalAudioUnlockListener();

async function probeIntroAssetAvailability() {
  if (typeof window === 'undefined') return 'synth';

  try {
    const response = await fetch(INTRO_SOUND_SRC, { method: 'HEAD', cache: 'no-store' });
    if (!response.ok) return 'synth';

    const contentType = (response.headers.get('content-type') || '').toLowerCase();
    if (contentType.includes('text/html')) return 'synth';
    if (contentType.includes('audio') || contentType.includes('mpeg')) return 'file';

    return 'file';
  } catch {
    return 'synth';
  }
}

async function resolveIntroSourceMode() {
  if (introSourceMode) return introSourceMode;

  if (!introSourceProbePromise) {
    introSourceProbePromise = probeIntroAssetAvailability().then((mode) => {
      introSourceMode = mode;
      return mode;
    });
  }

  return introSourceProbePromise;
}

function cancelVolumeFade() {
  if (fadeFrameId !== null) {
    cancelAnimationFrame(fadeFrameId);
    fadeFrameId = null;
  }
}

function clearIntroPlaybackTimers() {
  if (autoFadeTimerId !== null) {
    clearTimeout(autoFadeTimerId);
    autoFadeTimerId = null;
  }

  if (autoStopTimerId !== null) {
    clearTimeout(autoStopTimerId);
    autoStopTimerId = null;
  }
}

function fadeVolume(audio, from, to, durationMs, onComplete) {
  cancelVolumeFade();

  if (!audio || durationMs <= 0) {
    if (audio) audio.volume = to;
    onComplete?.();
    return;
  }

  const startedAt = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startedAt) / durationMs, 1);
    const eased = 1 - (1 - progress) ** 2;
    audio.volume = from + (to - from) * eased;

    if (progress < 1) {
      fadeFrameId = requestAnimationFrame(step);
      return;
    }

    fadeFrameId = null;
    onComplete?.();
  };

  fadeFrameId = requestAnimationFrame(step);
}

function resetFileAudio(audio) {
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  audio.volume = 0;
}

function clearActiveSession() {
  activeSession = null;
}

function stopSynthNodes(session, { immediate = false, fadeOutMs = DEFAULT_FADE_OUT_MS } = {}) {
  if (!session?.oscillator || !session?.gainNode || !session?.context) {
    return Promise.resolve();
  }

  const { context, oscillator, gainNode } = session;

  if (session.stopTimerId) {
    clearTimeout(session.stopTimerId);
    session.stopTimerId = null;
  }

  const disconnect = () => {
    try {
      oscillator.stop();
    } catch {
      // Oscillator may already be stopped.
    }

    try {
      oscillator.disconnect();
    } catch {
      // Ignore disconnect errors on stale nodes.
    }

    try {
      gainNode.disconnect();
    } catch {
      // Ignore disconnect errors on stale nodes.
    }
  };

  if (immediate || fadeOutMs <= 0) {
    disconnect();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const now = context.currentTime;
    const currentGain = Math.max(gainNode.gain.value, 0.0001);

    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(currentGain, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + fadeOutMs / 1000);

    session.stopTimerId = window.setTimeout(() => {
      session.stopTimerId = null;
      disconnect();
      resolve();
    }, fadeOutMs);
  });
}

function resetIntroPlayback({ immediate = true, fadeOutMs = 0 } = {}) {
  clearIntroPlaybackTimers();
  cancelVolumeFade();

  const session = activeSession;
  clearActiveSession();

  if (!session) {
    resetFileAudio(introAudio);
    return Promise.resolve({ ok: true });
  }

  if (session.mode === 'file') {
    resetFileAudio(session.audio);
    return Promise.resolve({ ok: true });
  }

  return stopSynthNodes(session, { immediate, fadeOutMs }).then(() => ({ ok: true }));
}

function scheduleFileAutoFadeOut(audio, {
  fadeStartMs = INTRO_AUTO_FADE_START_MS,
  fadeOutMs = INTRO_AUTO_FADE_OUT_MS,
  maxDurationMs = INTRO_MAX_DURATION_MS,
} = {}) {
  clearIntroPlaybackTimers();

  autoFadeTimerId = window.setTimeout(() => {
    autoFadeTimerId = null;
    if (!audio || audio.paused) return;

    fadeVolume(audio, audio.volume, 0, fadeOutMs, () => {
      resetFileAudio(audio);
      if (activeSession?.mode === 'file' && activeSession.audio === audio) {
        clearActiveSession();
      }
    });
  }, fadeStartMs);

  autoStopTimerId = window.setTimeout(() => {
    autoStopTimerId = null;
    if (!audio) return;

    cancelVolumeFade();
    resetFileAudio(audio);
    if (activeSession?.mode === 'file' && activeSession.audio === audio) {
      clearActiveSession();
    }
  }, maxDurationMs);
}

function isAutoplayBlockedError(error) {
  if (!error) return false;
  return error.name === 'NotAllowedError' || error.name === 'AbortError';
}

async function playFileIntroSound(options = {}) {
  const audio = getIntroAudio();
  if (!audio) {
    return { ok: false, blocked: false, error: new Error('Áudio indisponível.') };
  }

  const {
    volume = DEFAULT_INTRO_VOLUME,
    fadeInMs = INTRO_FADE_IN_MS,
    maxDurationMs = INTRO_MAX_DURATION_MS,
    autoFadeOutMs = INTRO_AUTO_FADE_OUT_MS,
  } = options;

  resetFileAudio(audio);

  try {
    await audio.play();
    activeSession = { mode: 'file', audio };
    fadeVolume(audio, 0, volume, fadeInMs);
    scheduleFileAutoFadeOut(audio, {
      fadeStartMs: Math.max(0, maxDurationMs - autoFadeOutMs),
      fadeOutMs: autoFadeOutMs,
      maxDurationMs,
    });
    return { ok: true, blocked: false, source: 'file', audio };
  } catch (error) {
    resetFileAudio(audio);
    clearActiveSession();

    if (!isAutoplayBlockedError(error)) {
      console.warn('[soundEffects] Falha ao reproduzir vinheta em arquivo:', error);
      return { ok: false, blocked: false, error, source: 'file' };
    }

    console.warn('[soundEffects] Autoplay bloqueado para a vinheta de abertura.');
    return { ok: false, blocked: true, error, source: 'file' };
  }
}

async function playSynthIntroSound(options = {}) {
  const context = getOrCreateAudioContext();
  if (!context) {
    return { ok: false, blocked: false, error: new Error('Web Audio API indisponível.') };
  }

  const {
    volume = DEFAULT_INTRO_VOLUME,
    fadeInMs = INTRO_FADE_IN_MS,
    maxDurationMs = INTRO_MAX_DURATION_MS,
    autoFadeOutMs = INTRO_AUTO_FADE_OUT_MS,
  } = options;

  try {
    await unlockAudioContext();

    if (context.state === 'suspended') {
      await context.resume();
    }

    if (context.state !== 'running') {
      return { ok: false, blocked: true, error: new Error('AudioContext suspenso.'), source: 'synth' };
    }
  } catch (error) {
    return { ok: false, blocked: isAutoplayBlockedError(error), error, source: 'synth' };
  }

  await resetIntroPlayback({ immediate: true });

  const durationSec = maxDurationMs / 1000;
  const fadeInSec = fadeInMs / 1000;
  const fadeOutSec = autoFadeOutMs / 1000;
  const fadeOutStartSec = Math.max(fadeInSec, durationSec - fadeOutSec);
  const peakGain = SYNTH_PEAK_GAIN;
  const startTime = context.currentTime;

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(SYNTH_START_FREQ_HZ, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(SYNTH_END_FREQ_HZ, startTime + durationSec);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + fadeInSec);
  gainNode.gain.setValueAtTime(peakGain, startTime + fadeOutStartSec);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + durationSec);

  const session = {
    mode: 'synth',
    context,
    oscillator,
    gainNode,
    stopTimerId: null,
  };
  activeSession = session;

  session.stopTimerId = window.setTimeout(() => {
    session.stopTimerId = null;
    stopSynthNodes(session, { immediate: true }).then(() => {
      if (activeSession === session) {
        clearActiveSession();
      }
    });
  }, maxDurationMs);

  return { ok: true, blocked: false, source: 'synth' };
}

export function preloadIntroSound() {
  attachGlobalAudioUnlockListener();

  resolveIntroSourceMode().then((mode) => {
    if (mode === 'file') {
      getIntroAudio()?.load();
      return;
    }

    getOrCreateAudioContext();
  });
}

/**
 * Hit grave minimalista (1,5s). Usa MP3 se existir; senão sintetiza sub-bass via Web Audio API.
 */
export async function playIntroSound(options = {}) {
  if (typeof window === 'undefined') {
    return { ok: false, blocked: false, error: new Error('Ambiente sem áudio.') };
  }

  await unlockAudioContext();
  await resetIntroPlayback({ immediate: true });

  const mode = await resolveIntroSourceMode();

  if (mode === 'file') {
    const fileResult = await playFileIntroSound(options);
    if (fileResult.ok) return fileResult;

    if (fileResult.blocked) return fileResult;

    introSourceMode = 'synth';
    return playSynthIntroSound(options);
  }

  return playSynthIntroSound(options);
}

/**
 * Interrompe a vinheta. Use `{ immediate: true }` no skip para corte seco.
 */
export function stopIntroSound(options = {}) {
  const { fadeOutMs = DEFAULT_FADE_OUT_MS, immediate = false } = options;
  return resetIntroPlayback({ immediate, fadeOutMs: immediate ? 0 : fadeOutMs });
}

export async function retryIntroSoundAfterUserGesture(options = {}) {
  return playIntroSound(options);
}
