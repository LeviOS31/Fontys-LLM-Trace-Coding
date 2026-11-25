const hostname = window.location.hostname;

export const BASE_URL = import.meta.env.VITE_API_URL || `http://${hostname}:5248`;
