import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Dark Stream';
export const DEFAULT_SITE_TITLE = SITE_NAME;
export const DEFAULT_SITE_DESCRIPTION =
  'A plataforma de streaming de true crime e investigação social.';

const DEFAULT_DESCRIPTION = DEFAULT_SITE_DESCRIPTION;

/**
 * Extrai os primeiros parágrafos de um texto para meta description (máx. ~160 chars).
 */
export function buildMetaDescription(text, maxLength = 160) {
  if (!text || typeof text !== 'string') return DEFAULT_DESCRIPTION;

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const source = paragraphs.length > 0 ? paragraphs.slice(0, 2).join(' ') : text.replace(/\s+/g, ' ').trim();
  if (!source) return DEFAULT_DESCRIPTION;
  if (source.length <= maxLength) return source;

  const truncated = source.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const cut = lastSpace > maxLength * 0.6 ? lastSpace : maxLength;
  return `${truncated.slice(0, cut).trim()}…`;
}

export function buildVideoPageTitle(caseTitle) {
  const name = caseTitle?.trim() || 'Sem título';
  return `Caso ${name} | ${SITE_NAME}`;
}

export function buildPartnerPageTitle(partnerName) {
  const name = partnerName?.trim() || 'Parceiro';
  return `Canal de ${name} | ${SITE_NAME}`;
}

export default function SeoHead({
  title,
  description,
  image,
  type = 'website',
  noIndex = false,
}) {
  const metaDescription = description || DEFAULT_DESCRIPTION;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={metaDescription} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
