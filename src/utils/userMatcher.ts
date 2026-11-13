/**
 * Robust user matcher utility for PulseNearby.
 * Matches user IDs and usernames reliably, resolving differences between
 * deterministic IDs ('user_rahul'), raw usernames ('rahul'), and legacy timestamped IDs ('user_1731433035123_rahul').
 */

export interface UserIdentifiable {
  id?: string;
  username?: string;
}

export function isUserMatch(
  userA: string | UserIdentifiable | null | undefined,
  target: string | UserIdentifiable | null | undefined
): boolean {
  if (!userA || !target) return false;

  const sanitize = (val: string | UserIdentifiable | null | undefined): { id: string; username: string } => {
    if (!val) return { id: '', username: '' };
    if (typeof val === 'object') {
      const id = String(val.id || '').toLowerCase().trim().replace(/^@/, '');
      const username = String(val.username || '').toLowerCase().trim().replace(/^@/, '');
      return { id, username: username || id.replace(/^user_/, '').replace(/^\d+_/, '') };
    }
    const raw = String(val).toLowerCase().trim().replace(/^@/, '');
    const cleanU = raw.replace(/^user_/, '').replace(/^\d+_/, '');
    return { id: raw, username: cleanU };
  };

  const a = sanitize(userA);
  const t = sanitize(target);

  // Direct ID or username match
  if (a.id && t.id && a.id === t.id) return true;
  if (a.username && t.username && a.username === t.username) return true;

  // Cross ID vs Username
  if (a.id && t.username && (a.id === t.username || a.id === `user_${t.username}`)) return true;
  if (t.id && a.username && (t.id === a.username || t.id === `user_${a.username}`)) return true;

  // Suffix matching for timestamped IDs (e.g. 'user_1731433035123_rahul')
  if (a.username && t.id.endsWith(`_${a.username}`)) return true;
  if (t.username && a.id.endsWith(`_${t.username}`)) return true;

  // Special case for default user Harsh
  const isHarshA = a.id === 'user_harsh_original' || a.username === 'harshsisodiya9425';
  const isHarshT = t.id === 'user_harsh_original' || t.username === 'harshsisodiya9425';
  if (isHarshA && isHarshT) return true;

  return false;
}

/**
 * Returns a canonical, consistent ID for any user or username
 */
export function getCanonicalUserId(usernameOrId: string): string {
  const clean = (usernameOrId || '').trim().toLowerCase().replace(/^@/, '');
  if (clean === 'harshsisodiya9425' || clean === 'user_harsh_original') {
    return 'user_harsh_original';
  }
  if (clean.startsWith('user_')) {
    // If it's a timestamped ID like user_1731433035123_rahul, extract rahul
    const parts = clean.split('_');
    if (parts.length >= 3 && /^\d+$/.test(parts[1])) {
      return `user_${parts.slice(2).join('_')}`;
    }
    return clean;
  }
  return `user_${clean}`;
}
