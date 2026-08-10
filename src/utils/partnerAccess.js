/**
 * Parceiro verificado da plataforma (criador monetizado).
 * Admin/tester só entram aqui se is_partner estiver marcado no perfil.
 */
export function isOfficialPartner(profile) {
  if (!profile) return false;
  return profile.role === 'partner' || profile.is_partner === true;
}
