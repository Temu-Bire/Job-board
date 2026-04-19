import { io } from 'socket.io-client';
import { getSocketBaseUrl } from '../config/env';

/**
 * Authenticated Socket.IO client for Render / split frontend+API deployments.
 */
export function connectAuthSocket(token, socketOptions = {}) {
  const authToken = token ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null);
  if (!authToken) return null;

  const url = getSocketBaseUrl();
  if (!url) {
    // eslint-disable-next-line no-console
    console.warn(
      '[socket] No server URL: set VITE_SOCKET_URL or VITE_BACKEND_ORIGIN (or a full VITE_API_BASE_URL) so Socket.IO can reach your API.'
    );
    return null;
  }

  return io(url, {
    auth: { token: authToken },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelay: (attempt) => Math.min(1000 * 2 ** Math.min(attempt, 5), 30_000),
    timeout: 25_000,
    withCredentials: true,
    ...socketOptions,
  });
}
