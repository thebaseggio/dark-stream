/**
 * Utilitários de apoio financeiro a parceiros.
 */

export async function fetchActiveSupporterIds(supabase, partnerId, userIds) {
  if (!supabase || !partnerId || !Array.isArray(userIds) || userIds.length === 0) {
    return new Set();
  }

  const uniqueIds = [...new Set(userIds.filter(Boolean))];

  const { data, error } = await supabase.rpc('get_active_partner_supporter_ids', {
    p_partner_id: partnerId,
    p_user_ids: uniqueIds,
  });

  if (error) {
    console.error('Erro ao buscar apoiadores ativos:', error);
    return new Set();
  }

  return new Set(Array.isArray(data) ? data : []);
}

export async function isActivePartnerSupporter(supabase, userId, partnerId) {
  if (!supabase || !userId || !partnerId) return false;

  const { data, error } = await supabase.rpc('is_active_partner_supporter', {
    p_user_id: userId,
    p_partner_id: partnerId,
  });

  if (error) {
    console.error('Erro ao verificar apoiador:', error);
    return false;
  }

  return Boolean(data);
}
