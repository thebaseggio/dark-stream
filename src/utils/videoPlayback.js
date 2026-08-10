const PROGRESS_KEY_PREFIX = 'darkstream:video-progress:';

export function getVideoProgressKey(userId, videoId) {
  const owner = userId || 'guest';
  return `${PROGRESS_KEY_PREFIX}${owner}:${videoId}`;
}

export function readVideoProgress(userId, videoId) {
  if (!videoId) return 0;
  const saved = Number(sessionStorage.getItem(getVideoProgressKey(userId, videoId)));
  return Number.isFinite(saved) && saved > 0 ? saved : 0;
}

export function saveVideoProgress(userId, videoId, currentTime) {
  if (!videoId) return;
  sessionStorage.setItem(getVideoProgressKey(userId, videoId), String(currentTime));
}

export function parseResumeSecondsFromSearch(search = '') {
  const params = new URLSearchParams(search);
  const seconds = Number(params.get('t'));
  return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
}

export function shouldFetchResumeProgressFromSearch(search = '') {
  return new URLSearchParams(search).get('resume') === '1';
}

export function buildVideoPathWithResume(videoId, progressSeconds) {
  if (!videoId) return '/casos';
  if (!progressSeconds || progressSeconds <= 0) return `/video/${videoId}`;
  return `/video/${videoId}?t=${Math.floor(progressSeconds)}`;
}

export function clearVideoProgressSession() {
  const keysToRemove = [];

  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(PROGRESS_KEY_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => sessionStorage.removeItem(key));
}
