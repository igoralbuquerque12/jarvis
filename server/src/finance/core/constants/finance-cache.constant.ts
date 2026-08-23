export const SECURO_ADMIN_TOKEN_CACHE_KEY = 'finance:securo:admin-token';

export function securoUserTokenCacheKey(profileId: string): string {
  return `finance:securo:user-token:${profileId}`;
}

// Securo JWTs expire after 24 hours - 1 hour saved margin
export const SECURO_TOKEN_CACHE_TTL_SECONDS = 23 * 60 * 60;
