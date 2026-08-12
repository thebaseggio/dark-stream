const HTML_TAG = /<[^>]*>/g;
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

export function stripHtml(text) {
  return String(text ?? '').replace(HTML_TAG, '');
}

/**
 * Sanitiza texto plano antes de persistir no banco.
 * Remove tags HTML, caracteres de controle e normaliza espaços.
 */
export function sanitizePlainText(text, options = {}) {
  const {
    maxLength,
    collapseBlankLines = false,
    allowNewlines = true,
  } = options;

  let result = stripHtml(String(text ?? ''));
  result = result.replace(CONTROL_CHARS, '');

  if (collapseBlankLines) {
    result = result.trim().replace(/\n{3,}/g, '\n\n');
  } else {
    result = result.trim();
  }

  if (!allowNewlines) {
    result = result.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  if (maxLength && result.length > maxLength) {
    result = result.slice(0, maxLength);
  }

  return result;
}

export function sanitizeUsername(text, maxLength = 50) {
  return sanitizePlainText(text, { maxLength, allowNewlines: false });
}

export function sanitizeBio(text, maxLength = 500) {
  return sanitizePlainText(text, { maxLength, collapseBlankLines: true });
}

export function sanitizeCommentText(text, maxLength = 2000) {
  return sanitizePlainText(text, { maxLength, collapseBlankLines: true });
}

export function sanitizeSuggestionTitle(text, maxLength = 200) {
  return sanitizePlainText(text, { maxLength, allowNewlines: false });
}

export function sanitizeSuggestionDescription(text, maxLength = 2000) {
  return sanitizePlainText(text, { maxLength, collapseBlankLines: true });
}

export function sanitizeFormMessage(text, maxLength = 5000) {
  return sanitizePlainText(text, { maxLength, collapseBlankLines: true });
}

/** Sanitização genérica de texto antes de persistir no banco. */
export function sanitizeText(text, maxLength = 5000) {
  return sanitizePlainText(text, { maxLength, collapseBlankLines: true });
}
