import { useState, useEffect, useCallback } from 'react';
import { watchStatusAPI } from '../services/api';
import { Movie, APIError } from '../types';

interface UseMyMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export const useMyMovies = (): UseMyMoviesResult => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await watchStatusAPI.getMyMovies();
      setMovies(response.data.movies);
    } catch (err) {
      const error = err as APIError;
      setError(error.response?.data?.error || 'Failed to load movies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return { movies, loading, error, refetch: fetchMovies };
};
