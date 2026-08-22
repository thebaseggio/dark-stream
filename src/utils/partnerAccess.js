/**
 * Parceiro verificado da plataforma (criador monetizado).
 */
export function isPartnerAccount(profile) {
  if (!profile) return false;

  const role = String(profile.role || '').trim().toLowerCase();
  if (role === 'partner') return true;

  const partnerFlag = profile.is_partner;
  if (partnerFlag === true || partnerFlag === 'true' || partnerFlag === 1 || partnerFlag === '1') {
    return true;
  }

  return false;
}

/** @deprecated Prefer isPartnerAccount */
export function isOfficialPartner(profile) {
  return isPartnerAccount(profile);
}

export function canAccessPartnerDashboard(profile) {
  const role = String(profile?.role || '').trim().toLowerCase();
  return ['partner', 'admin', 'tester'].includes(role) || isPartnerAccount(profile);
}

export function shouldShowChannelProfileNav(profile, tabFromUrl = null) {
  if (tabFromUrl === 'channel' || tabFromUrl === 'channel-profile') return true;
  return isPartnerAccount(profile) || canAccessPartnerDashboard(profile);
}
