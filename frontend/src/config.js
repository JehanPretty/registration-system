const getApiBaseUrl = () => {
  const { hostname, protocol } = window.location;
  
  // Use the same protocol as the frontend to avoid security blocks (Mixed Content)
  return `${protocol}//${hostname}:8000`;
};

export const API_BASE_URL = getApiBaseUrl();
