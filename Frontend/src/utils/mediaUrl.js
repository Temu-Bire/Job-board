import { getBackendOrigin } from '../config/env';

/**
 * Turn stored DB paths into browser-loadable URLs.
 * - `https://...` → unchanged (Cloudinary / absolute)
 * - `/uploads/...` → prefixed with VITE_BACKEND_ORIGIN (or derived from API URL) in production
 * - Dev: `/uploads` hits Vite proxy when backend origin is empty
 */
export function resolveMediaUrl(url) {
  if (url == null) return '';
  const trimmed = String(url).trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;

  const origin = getBackendOrigin();
  if (trimmed.startsWith('/') && origin) {
    return `${origin}${trimmed}`;
  }
  return trimmed;
}

/** Apply resolveMediaUrl to common user media fields (localStorage hydration). */
export function withResolvedMediaUser(user) {
  if (!user || typeof user !== 'object') return user;
  const r = resolveMediaUrl;
  return {
    ...user,
    avatarUrl: r(user.avatarUrl),
    resumeUrl: r(user.resumeUrl),
    logoUrl: r(user.logoUrl),
    profile: user.profile
      ? {
          ...user.profile,
          avatarUrl: r(user.profile.avatarUrl),
          resumeUrl: r(user.profile.resumeUrl),
          logoUrl: r(user.profile.logoUrl),
        }
      : user.profile,
  };
}
