import { supabase } from '../supabase';

const AVATAR_BUCKET = 'avatars';
const BANNER_BUCKET = 'banners';

const STORAGE_UUID_ONLY =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const IMAGE_FILE_REGEX = /\.(jpe?g|png|gif|webp|avif|bmp|svg)(\?|#|$)/i;

/**
 * Rejeita paths/URLs que apontam para pasta (ex.: só o UUID do usuário) em vez de arquivo.
 */
function looksLikeCompleteMediaTarget(value) {
  if (!value || typeof value !== 'string') return false;

  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) return false;

  let pathToCheck = trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      pathToCheck = new URL(trimmed).pathname;
    } catch {
      return false;
    }
  } else {
    pathToCheck = trimmed.replace(/^\/+/, '');
  }

  const lastSegment = pathToCheck.split('/').pop() || '';
  if (!lastSegment || STORAGE_UUID_ONLY.test(lastSegment)) return false;

  return IMAGE_FILE_REGEX.test(lastSegment);
}

/** Select core — compatível com bancos sem colunas de assinatura */
export const PROFILE_FIELDS_CORE =
  'id, username, bio, role, avatar_url, banner_url, youtube_url, instagram_url, x_url, "creatorAvatar"';

/** Select explícito — garante que "creatorAvatar" (camelCase) volte do PostgREST */
export const PROFILE_FIELDS_SELECT =
  `${PROFILE_FIELDS_CORE}, subscription_plan, subscription_status`;

export function isMissingProfileColumnError(error) {
  if (!error) return false;
  const message = error.message || '';
  return (
    error.code === '42703'
    || error.code === 'PGRST204'
    || message.includes('does not exist')
    || message.includes('subscription_plan')
    || message.includes('subscription_status')
  );
}

/**
 * Valida se a URL pode ser usada em <img> ou background-image.
 * Regras intencionalmente permissivas para URLs do Supabase Storage.
 */
export function isValidRenderableUrl(value) {
  if (value == null || typeof value !== 'string') return false;

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return false;
  if (!/^https?:\/\/.+/i.test(trimmed)) return false;

  try {
    const parsed = new URL(trimmed);
    return Boolean(parsed.hostname) && parsed.pathname.length > 1;
  } catch {
    return false;
  }
}

/**
 * Valida se a string é uma URL pública absoluta do Storage.
 */
export function isAbsolutePublicUrl(value) {
  return isValidRenderableUrl(value);
}

/**
 * Coleta todos os valores brutos de avatar possíveis no objeto profile.
 */
export function getAvatarFieldCandidates(profile) {
  if (!profile) return [];

  return [
    profile.avatar_url,
    profile.creatorAvatar,
    profile.creatoravatar,
    profile.avatarUrl,
    profile.creator_avatar,
  ];
}

/**
 * Normaliza valor bruto do banco antes de resolver.
 */
function normalizeRawMediaValue(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;
  return trimmed;
}

/**
 * Converte path do Storage ou URL parcial em URL pública completa.
 */
export function getStoragePublicUrl(bucket, pathOrUrl) {
  const raw = normalizeRawMediaValue(pathOrUrl);
  if (!raw) return null;

  if (isValidRenderableUrl(raw)) {
    return looksLikeCompleteMediaTarget(raw) ? raw : null;
  }

  if (isAbsolutePublicUrl(raw) && !isValidRenderableUrl(raw)) return null;

  const normalizedPath = raw.replace(/^\/+/, '').replace(/\/+$/, '');
  if (!normalizedPath || normalizedPath === 'undefined' || normalizedPath === 'null') {
    return null;
  }

  if (!looksLikeCompleteMediaTarget(normalizedPath)) return null;

  const { data } = supabase.storage.from(bucket).getPublicUrl(normalizedPath);
  const publicUrl = data?.publicUrl?.trim() || null;
  return looksLikeCompleteMediaTarget(publicUrl) ? publicUrl : null;
}

/**
 * Faz upload, obtém URL pública completa e valida antes de persistir.
 */
export async function uploadProfileMedia({ bucket, userId, file, prefix }) {
  if (!file || !userId) {
    throw new Error('Arquivo ou usuário inválido para upload.');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const filePath = `${userId}/${prefix}-${Date.now()}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true,
      cacheControl: '3600',
      contentType: file.type || `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
    });

  if (uploadError) throw uploadError;

  const storedPath = uploadData?.path || filePath;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storedPath);
  const publicUrl = urlData?.publicUrl?.trim();

  if (!isValidRenderableUrl(publicUrl)) {
    throw new Error(
      `Não foi possível gerar URL pública para o bucket "${bucket}". ` +
      'Confirme no Supabase que o bucket está marcado como Público.'
    );
  }

  return { publicUrl, storedPath, bucket };
}

export async function uploadAvatarImage(userId, file) {
  return uploadProfileMedia({
    bucket: AVATAR_BUCKET,
    userId,
    file,
    prefix: 'avatar',
  });
}

export async function uploadBannerImage(userId, file) {
  return uploadProfileMedia({
    bucket: BANNER_BUCKET,
    userId,
    file,
    prefix: 'banner',
  });
}

/**
 * Resolve avatar a partir do perfil — prioriza avatar_url.
 */
export function resolveAvatarUrl(profile) {
  if (!profile) return null;

  const candidates = getAvatarFieldCandidates(profile);

  for (const candidate of candidates) {
    const raw = normalizeRawMediaValue(candidate);
    if (!raw) continue;
    if (isValidRenderableUrl(raw)) return raw;
    const resolved = getStoragePublicUrl(AVATAR_BUCKET, raw);
    if (resolved) return resolved;
  }

  return null;
}

/**
 * Resolve banner a partir do perfil.
 */
export function resolveBannerUrl(profile) {
  if (!profile) return null;

  const candidates = [profile.banner_url, profile.bannerUrl];

  for (const candidate of candidates) {
    const raw = normalizeRawMediaValue(candidate);
    if (!raw) continue;
    if (isValidRenderableUrl(raw)) return raw;
    const resolved = getStoragePublicUrl(BANNER_BUCKET, raw);
    if (resolved) return resolved;
  }

  return null;
}

/**
 * Payload com URLs públicas completas — nunca paths relativos.
 */
export function buildAvatarUpdatePayload(publicUrl) {
  if (!isValidRenderableUrl(publicUrl)) {
    throw new Error('avatar_url deve ser uma URL pública completa (https://...).');
  }
  return {
    avatar_url: publicUrl,
    creatorAvatar: publicUrl,
  };
}

export function buildBannerUpdatePayload(publicUrl) {
  if (!isValidRenderableUrl(publicUrl)) {
    throw new Error('banner_url deve ser uma URL pública completa (https://...).');
  }
  return {
    banner_url: publicUrl,
  };
}

/**
 * Persiste qualquer payload no profiles com logs de debug.
 */
export async function persistProfileUpdate(supabase, userId, payload) {
  console.log('Tentando salvar no banco:', payload);

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select(PROFILE_FIELDS_SELECT)
    .single();

  if (error) {
    console.error('Erro ao salvar perfil no Supabase:', error);
    return { data: null, error };
  }

  console.log('Perfil salvo com sucesso:', data);
  return { data, error: null };
}

/**
 * Salva URL do avatar — tenta avatar_url + creatorAvatar, depois fallbacks.
 */
export async function persistAvatarUrl(supabase, userId, publicUrl) {
  const attempts = [
    buildAvatarUpdatePayload(publicUrl),
    { creatorAvatar: publicUrl },
    { avatar_url: publicUrl },
  ];

  let lastError = null;

  for (const payload of attempts) {
    const { data, error } = await persistProfileUpdate(supabase, userId, payload);
    if (!error && data) return { data, error: null };
    lastError = error;
  }

  return { data: null, error: lastError };
}

/**
 * Salva URL do banner.
 */
export async function persistBannerUrl(supabase, userId, publicUrl) {
  return persistProfileUpdate(supabase, userId, buildBannerUpdatePayload(publicUrl));
}

export const PROFILE_MEDIA_BUCKETS = {
  avatar: AVATAR_BUCKET,
  banner: BANNER_BUCKET,
};
