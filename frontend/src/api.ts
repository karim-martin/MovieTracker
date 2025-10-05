import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// User API (Admin)
export const userAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id: string) => api.get(`/users/${id}`),
  blockUser: (id: string) => api.patch(`/users/${id}/block`),
  unblockUser: (id: string) => api.patch(`/users/${id}/unblock`),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};

// Movie API
export const movieAPI = {
  getAllMovies: (params?: {
    title?: string;
    genre?: string;
    person?: string;
    page?: number;
    limit?: number;
  }) => api.get('/movies', { params }),
  getMovieById: (id: string) => api.get(`/movies/${id}`),
  createMovie: (data: any) => api.post('/movies', data),
  updateMovie: (id: string, data: any) => api.put(`/movies/${id}`, data),
  deleteMovie: (id: string) => api.delete(`/movies/${id}`),
};

// Genre API
export const genreAPI = {
  getAllGenres: () => api.get('/genres'),
  createGenre: (data: { name: string }) => api.post('/genres', data),
  deleteGenre: (id: string) => api.delete(`/genres/${id}`),
};

// Person API
export const personAPI = {
  getAllPeople: (params?: { name?: string; type?: string }) =>
    api.get('/people', { params }),
  createPerson: (data: { name: string; type: string }) =>
    api.post('/people', data),
  deletePerson: (id: string) => api.delete(`/people/${id}`),
};

// Rating API
export const ratingAPI = {
  createRating: (data: {
    movieId: string;
    rating: number;
    review?: string;
    watchedDate: string;
  }) => api.post('/ratings', data),
  getMyRatings: () => api.get('/ratings/my'),
  getRatingByMovie: (movieId: string) => api.get(`/ratings/movie/${movieId}`),
  updateRating: (id: string, data: any) => api.put(`/ratings/${id}`, data),
  deleteRating: (id: string) => api.delete(`/ratings/${id}`),
};

// Collection API
export const collectionAPI = {
  createCollection: (data: { name: string; description?: string }) =>
    api.post('/collections', data),
  getMyCollections: () => api.get('/collections/my'),
  getCollectionById: (id: string) => api.get(`/collections/${id}`),
  addMovieToCollection: (collectionId: string, movieId: string) =>
    api.post(`/collections/${collectionId}/movies`, { movieId }),
  removeMovieFromCollection: (collectionId: string, movieId: string) =>
    api.delete(`/collections/${collectionId}/movies/${movieId}`),
  deleteCollection: (id: string) => api.delete(`/collections/${id}`),
};

export default api;
