// Centralized API URL configuration
// Uses VITE_API_URL from environment, falls back to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = `${API_BASE_URL}/api`;

export { API_BASE_URL, API_URL };
