const DEFAULT_API_BASE_URL = 'https://knowbharat-production.up.railway.app';

export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');

export function buildApiUrl(path = '') {
  if (!path) return API_BASE_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}