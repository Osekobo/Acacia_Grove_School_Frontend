import axios from "axios";

export const ACCESS_KEY = "bh_access_token";
export const REFRESH_KEY = "bh_refresh_token";

const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { "Content-Type": "application/json" },
});

export function setTokens(accessToken, refreshToken) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const refreshToken = localStorage.getItem(REFRESH_KEY);

    if (status === 401 && !original._retried && refreshToken) {
      original._retried = true;
      try {
        refreshing =
          refreshing ||
          axios.post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken });
        const { data } = await refreshing;
        refreshing = null;
        setTokens(data.access_token, data.refresh_token);
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return api(original);
      } catch (refreshError) {
        refreshing = null;
        clearTokens();
        window.dispatchEvent(new Event("bh:logout"));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error) {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg || JSON.stringify(d)).join(", ");
  if (error?.code === "ERR_NETWORK") return "Cannot reach the server. Is the backend running?";
  return error?.message || "Something went wrong";
}

export default api;