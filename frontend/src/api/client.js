import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

// The access token is kept in memory only; the refresh token is an httpOnly cookie
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

const api = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Share one refresh request between parallel calls (refresh tokens are single-use)
let refreshPromise = null;

export const refreshAccessToken = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(({ data }) => {
        setAccessToken(data.data.accessToken);
        return data.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const SKIP_REFRESH_URLS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

// When the access token expires, refresh it once and retry the original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const shouldRefresh =
      error.response?.status === 401 && original && !original._retry && !SKIP_REFRESH_URLS.includes(original.url);

    if (!shouldRefresh) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      await refreshAccessToken();
      return api(original);
    } catch (refreshError) {
      setAccessToken(null);
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(refreshError);
    }
  }
);

export const getErrorMessage = (error) =>
  error.response?.data?.error?.message || error.message || 'Something went wrong';

export default api;
