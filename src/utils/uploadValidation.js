export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const ACCEPTED_THUMBNAIL_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const MAX_VIDEO_SIZE_BYTES = 2 * 1024 * 1024 * 1024;
export const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024;

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function validateFile(file, { acceptedTypes, maxSizeBytes, label }) {
  if (!file) {
    return null;
  }

  if (!acceptedTypes.includes(file.type)) {
    return `${label} deve estar em um dos formatos aceitos: ${acceptedTypes.join(', ')}.`;
  }

  if (file.size > maxSizeBytes) {
    return `${label} deve ter no máximo ${formatFileSize(maxSizeBytes)}.`;
  }

  return null;
}

export function validateVideoFile(file) {
  return validateFile(file, {
    acceptedTypes: ACCEPTED_VIDEO_TYPES,
    maxSizeBytes: MAX_VIDEO_SIZE_BYTES,
    label: 'O vídeo',
  });
}

export function validateThumbnailFile(file) {
  return validateFile(file, {
    acceptedTypes: ACCEPTED_THUMBNAIL_TYPES,
    maxSizeBytes: MAX_THUMBNAIL_SIZE_BYTES,
    label: 'A thumbnail',
  });
}
