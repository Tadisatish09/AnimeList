import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('anivault_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login failure attempts
      if (!error.config.url.includes('/login')) {
        localStorage.removeItem('anivault_token');
        localStorage.removeItem('anivault_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  login: (email, password) => api.post('/login', { email, password }),
  register: (name, email, password) => api.post('/login/newuser', { name, email, password }),
  getProfile: () => api.get('/profile'),
};

// Anime External Search
export const animeApi = {
  search: (query, limit = 12) => api.get('/anime/search', { params: { q: query, limit } }),
  getDetails: (malId) => api.get(`/anime/${malId}`),
};

// Watchlist Endpoints
export const watchlistApi = {
  getWatchlist: () => api.get('/watchlist'),
  addToWatchlist: (data) => api.post('/watchlist', data),
  removeFromWatchlist: (id) => api.delete(`/watchlist/${id}`),
};

// Watched Endpoints
export const watchedApi = {
  getWatched: (sort = 'recent') => api.get('/watched', { params: { sort } }),
  addToWatched: (data) => api.post('/watched', data),
  updateWatched: (id, data) => api.put(`/watched/${id}`, data),
  deleteWatched: (id) => api.delete(`/watched/${id}`),
};

export default api;
