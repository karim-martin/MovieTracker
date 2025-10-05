import { useState, useEffect, useCallback } from 'react';
import { movieAPI } from '../services/api';
import { Movie, MovieSearchParams } from '../types';

interface UseMoviesResult {
  movies: Movie[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export const useMovies = (params?: MovieSearchParams): UseMoviesResult => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await movieAPI.getAllMovies(params);
      setMovies(response.data.movies);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load movies');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return { movies, loading, error, refetch: fetchMovies };
};

interface UseMovieResult {
  movie: Movie | null;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
}

export const useMovie = (id: string): UseMovieResult => {
  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMovie = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await movieAPI.getMovieById(id);
      setMovie(response.data.movie);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load movie');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchMovie();
    }
  }, [fetchMovie, id]);

  return { movie, loading, error, refetch: fetchMovie };
};
