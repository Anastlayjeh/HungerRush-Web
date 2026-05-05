const DEFAULT_API_BASE_URL = import.meta.env.DEV
  ? "http://127.0.0.1:8000/api"
  : "/api";

function normalizeApiBaseUrl(value) {
  const baseUrl = String(value || DEFAULT_API_BASE_URL).trim();
  return baseUrl.replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export function buildApiUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!API_BASE_URL) {
    return normalizedPath;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}
