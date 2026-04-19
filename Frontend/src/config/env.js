const stripTrailingSlash = (s) => String(s || '').replace(/\/$/, '');

/**
 * Axios base URL. Prefer VITE_API_BASE_URL (docs) or VITE_API_URL (legacy).
 * Dev default: `/api` (Vite proxy → backend).
 */
export function getApiBaseUrl() {
  const explicit =
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    import.meta.env.VITE_API_URL?.trim() ||
    '';
  if (explicit) return stripTrailingSlash(explicit);
  if (import.meta.env.PROD) {
    // eslint-disable-next-line no-console
    console.warn(
      '[config] VITE_API_BASE_URL is unset — using same-origin `/api` only. If your API is hosted separately, set VITE_API_BASE_URL (e.g. https://your-api.onrender.com/api).'
    );
  }
  return '/api';
}

/** True when Google Sign-In can be shown (requires provider + client id). */
export function hasGoogleAuth() {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim());
}

/**
 * Public backend origin (no `/api`), used for Socket.IO and resolving `/uploads/...` URLs.
 * Set `VITE_BACKEND_ORIGIN=https://your-service.onrender.com` when the UI is on another host.
 */
export function getBackendOrigin() {
  const direct = import.meta.env.VITE_BACKEND_ORIGIN?.trim();
  if (direct) return stripTrailingSlash(direct);

  const api = getApiBaseUrl();
  if (api.startsWith('http')) {
    try {
      const u = new URL(api);
      return stripTrailingSlash(`${u.protocol}//${u.host}`);
    } catch {
      return '';
    }
  }
  return '';
}

/**
 * Socket.IO server URL (usually same as backend origin).
 */
export function getSocketBaseUrl() {
  const explicit = import.meta.env.VITE_SOCKET_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);
  const origin = getBackendOrigin();
  if (origin) return origin;
  if (import.meta.env.DEV) return 'http://127.0.0.1:5000';
  // Production: never guess the socket host from the SPA origin — that breaks split
  // frontend (Vercel) + API (Render) deployments and causes ERR_CONNECTION_REFUSED.
  return '';
}
