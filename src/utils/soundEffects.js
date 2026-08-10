const INTRO_SOUND_SRC = '/intro-sound4.mp3';
const DEFAULT_INTRO_VOLUME = 0.85;
const DEFAULT_FADE_IN_MS = 450;
const DEFAULT_FADE_OUT_MS = 280;

let introAudio = null;
let fadeFrameId = null;

function getIntroAudio() {
  if (typeof window === 'undefined') return null;

  if (!introAudio) {
    introAudio = new Audio(INTRO_SOUND_SRC);
    introAudio.preload = 'auto';
  }

  return introAudio;
}

function cancelVolumeFade() {
  if (fadeFrameId !== null) {
    cancelAnimationFrame(fadeFrameId);
    fadeFrameId = null;
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
    audio.volume = from + (to - from) * progress;

    if (progress < 1) {
      fadeFrameId = requestAnimationFrame(step);
      return;
    }

    fadeFrameId = null;
    onComplete?.();
  };

  fadeFrameId = requestAnimationFrame(step);
}

function isAutoplayBlockedError(error) {
  if (!error) return false;
  return error.name === 'NotAllowedError' || error.name === 'AbortError';
}

export function preloadIntroSound() {
  const audio = getIntroAudio();
  if (!audio) return;

  audio.load();
}

/**
 * Dispara a vinheta sonora da abertura do player com fade-in suave.
 */
export async function playIntroSound(options = {}) {
  const audio = getIntroAudio();
  if (!audio) {
    return { ok: false, blocked: false, error: new Error('Áudio indisponível.') };
  }

  const {
    volume = DEFAULT_INTRO_VOLUME,
    fadeInMs = DEFAULT_FADE_IN_MS,
  } = options;

  cancelVolumeFade();
  audio.pause();
  audio.currentTime = 0;
  audio.volume = 0;

  try {
    await audio.play();
    fadeVolume(audio, 0, volume, fadeInMs);
    return { ok: true, blocked: false, audio };
  } catch (error) {
    if (!isAutoplayBlockedError(error)) {
      console.warn('[soundEffects] Falha ao reproduzir vinheta:', error);
    } else {
      console.warn('[soundEffects] Autoplay bloqueado para a vinheta de abertura.');
    }

    audio.pause();
    audio.currentTime = 0;
    return { ok: false, blocked: isAutoplayBlockedError(error), error };
  }
}

/**
 * Interrompe a vinheta com fade-out opcional.
 */
export function stopIntroSound(options = {}) {
  const audio = getIntroAudio();
  const { fadeOutMs = DEFAULT_FADE_OUT_MS } = options;

  if (!audio) {
    return Promise.resolve({ ok: true });
  }

  cancelVolumeFade();

  if (audio.paused) {
    audio.currentTime = 0;
    audio.volume = 0;
    return Promise.resolve({ ok: true });
  }

  return new Promise((resolve) => {
    const currentVolume = audio.volume;
    fadeVolume(audio, currentVolume, 0, fadeOutMs, () => {
      audio.pause();
      audio.currentTime = 0;
      resolve({ ok: true });
    });
  });
}

export async function retryIntroSoundAfterUserGesture(options = {}) {
  return playIntroSound(options);
}
