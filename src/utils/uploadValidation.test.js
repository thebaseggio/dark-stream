import {
  MAX_THUMBNAIL_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
  formatFileSize,
  validateThumbnailFile,
  validateVideoFile,
} from './uploadValidation';

function makeFile({ type, size }) {
  return { type, size };
}

describe('uploadValidation', () => {
  it('formats file sizes using readable units', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('accepts supported video files within the size limit', () => {
    const result = validateVideoFile(makeFile({ type: 'video/mp4', size: MAX_VIDEO_SIZE_BYTES }));

    expect(result).toBeNull();
  });

  it('rejects unsupported video formats', () => {
    const result = validateVideoFile(makeFile({ type: 'video/quicktime', size: 1024 }));

    expect(result).toContain('formatos aceitos');
  });

  it('rejects oversized thumbnails', () => {
    const result = validateThumbnailFile(
      makeFile({ type: 'image/png', size: MAX_THUMBNAIL_SIZE_BYTES + 1 }),
    );

    expect(result).toContain('no máximo');
  });
});
