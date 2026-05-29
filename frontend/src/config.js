const getApiBaseUrl = () => {
  // In production (Vercel), VITE_API_URL is set via Vercel Environment Variables.
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // Local dev fallback: same hostname, port 8000
  const { hostname, protocol } = window.location;
  return `${protocol}//${hostname}:8000`;
};

export const API_BASE_URL = getApiBaseUrl();
