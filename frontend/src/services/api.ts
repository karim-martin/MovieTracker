import axios, { AxiosResponse } from 'axios';
import { LoginInput, RegisterInput, AuthResponse, MoviesResponse, UsersResponse, MovieSearchParams, CreateRatingInput,
  RatingsResponse, GenresResponse, PersonSearchParams, Movie, WatchStatus, CreateWatchStatusInput, MoviePayload} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
      const publicPaths = ['/', '/login', '/register'];
      const currentPath = window.location.pathname;

      // Clear invalid token/user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if we're not already on a public page
      if (!publicPaths.includes(currentPath)) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: RegisterInput): Promise<AxiosResponse<AuthResponse>> => api.post('/auth/register', data),
  login: (data: LoginInput): Promise<AxiosResponse<AuthResponse>> => api.post('/auth/login', data),
  getMe: (): Promise<AxiosResponse> => api.get('/auth/me'),
  logout: (): Promise<AxiosResponse> => api.post('/auth/logout'),
};

// User API (Admin)
export const userAPI = {
  getAllUsers: (): Promise<AxiosResponse<UsersResponse>> => api.get('/users'),
  getUserById: (id: string): Promise<AxiosResponse> => api.get(`/users/${id}`),
  blockUser: (id: string): Promise<AxiosResponse> => api.patch(`/users/${id}/block`),
  unblockUser: (id: string): Promise<AxiosResponse> => api.patch(`/users/${id}/unblock`),
  deleteUser: (id: string): Promise<AxiosResponse> => api.delete(`/users/${id}`),
};

// Movie API
export const movieAPI = {
  getAllMovies: (params?: MovieSearchParams): Promise<AxiosResponse<MoviesResponse>> => api.get('/movies', { params }),
  getMovieById: (id: string): Promise<AxiosResponse<{ movie: Movie }>> => api.get(`/movies/${id}`),
  getRecommendations: (limit?: number): Promise<AxiosResponse<{ recommendations: Movie[]; message: string }>> => api.get('/movies/recommendations', { params: { limit } }),
  createMovie: (data: MoviePayload): Promise<AxiosResponse> => api.post('/movies', data),
  updateMovie: (id: string, data: MoviePayload): Promise<AxiosResponse> => api.put(`/movies/${id}`, data),
  deleteMovie: (id: string): Promise<AxiosResponse> => api.delete(`/movies/${id}`),
};

// Genre API
export const genreAPI = {
  getAllGenres: (): Promise<AxiosResponse<GenresResponse>> => api.get('/genres'),
  createGenre: (data: { name: string }): Promise<AxiosResponse> => api.post('/genres', data),
  deleteGenre: (id: string): Promise<AxiosResponse> => api.delete(`/genres/${id}`),
};

// Person API
export const personAPI = {
  getAllPeople: (params?: PersonSearchParams): Promise<AxiosResponse> => api.get('/people', { params }),
  createPerson: (data: { name: string; type: string }): Promise<AxiosResponse> => api.post('/people', data),
  deletePerson: (id: string): Promise<AxiosResponse> => api.delete(`/people/${id}`),
};

// Rating API
export const ratingAPI = {
  createRating: (data: CreateRatingInput): Promise<AxiosResponse> => api.post('/ratings', data),
  getMyRatings: (): Promise<AxiosResponse<RatingsResponse>> => api.get('/ratings/my'),
  getRatingByMovie: (movieId: string): Promise<AxiosResponse> => api.get(`/ratings/movie/${movieId}`),
  updateRating: (id: string, data: Partial<CreateRatingInput>): Promise<AxiosResponse> => api.put(`/ratings/${id}`, data),
  deleteRating: (id: string): Promise<AxiosResponse> => api.delete(`/ratings/${id}`),
};

// Watch Status API
export const watchStatusAPI = {
  toggleWatchStatus: (movieId: string, data?: CreateWatchStatusInput): Promise<AxiosResponse<{ watchStatus: WatchStatus }>> =>
    api.post(`/watch-status/${movieId}`, data || {}),
  getWatchStatus: (movieId: string): Promise<AxiosResponse<{ watchStatus: WatchStatus | null }>> =>
    api.get(`/watch-status/${movieId}`),
  getMyWatchedMovies: (): Promise<AxiosResponse<MoviesResponse>> =>
    api.get('/watch-status/my'),
  deleteWatchStatus: (movieId: string): Promise<AxiosResponse> =>
    api.delete(`/watch-status/${movieId}`),
};

// TMDB API (Admin only)
export const tmdbAPI = {
  searchMovies: (query: string, page?: number): Promise<AxiosResponse> =>
    api.get('/tmdb/search', { params: { query, page } }),
  getPopular: (page?: number): Promise<AxiosResponse> =>
    api.get('/tmdb/popular', { params: { page } }),
  getMovieDetails: (tmdbId: number): Promise<AxiosResponse> =>
    api.get(`/tmdb/movie/${tmdbId}`),
  importMovie: (tmdbId: number): Promise<AxiosResponse> =>
    api.post('/tmdb/import', { tmdbId }),
  bulkImport: (): Promise<AxiosResponse> =>
    api.post('/tmdb/import/bulk'),
};

export default api;
