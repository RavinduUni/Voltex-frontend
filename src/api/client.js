import axios from 'axios';
import { API_BASE_URL } from '../config';
import { session } from '../utils/storage';

/**
 * Shared axios instance. Adds `Authorization: Bearer <jwt>` to every call except
 * login and register. The backend identifies the user from the token.
 */
// No default Content-Type: axios sets application/json for plain objects by itself, and
// the browser sets multipart/form-data (with its boundary) for FormData uploads. A default
// JSON header would make axios convert FormData into JSON and break image uploads.
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

const PUBLIC_ROUTES = ['/users/login', '/users/register'];
const isPublicUrl = (url = '') => PUBLIC_ROUTES.some((r) => url.startsWith(r));

api.interceptors.request.use((config) => {
  const { token } = session.get();
  if (!isPublicUrl(config.url) && token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Listeners are notified when the backend rejects our token (expired or invalid).
const unauthorizedListeners = new Set();
export const onUnauthorized = (fn) => {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
};

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    // 401 = token missing, invalid or expired → sign out. 403 = signed in but not allowed → just an error.
    if (!isPublicUrl(error.config?.url) && status === 401 && session.get().token) {
      unauthorizedListeners.forEach((fn) => fn());
    }
    return Promise.reject(error);
  }
);

/** Turns any axios error into a short sentence the UI can show. */
export function errorMessage(error, fallback = 'Something went wrong. Try again.') {
  if (!error) return fallback;
  if (error.backendMessage) return error.backendMessage;
  if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Try again.';
  if (error.isAxiosError && !error.response) {
    return 'Can’t reach the store server. Check that the backend is running.';
  }
  const data = error.response?.data;
  if (typeof data === 'string' && data.trim() && data.length < 200) return data;
  if (data?.message && typeof data.message === 'string' && data.message.length < 200) return data.message;
  return error.message && !error.isAxiosError ? error.message : fallback;
}

export default api;
