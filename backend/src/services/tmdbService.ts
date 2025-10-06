import { MovieDb, DiscoverMovieRequest } from 'moviedb-promise';

const tmdb = new MovieDb(process.env.TMDB_API_KEY || '');

export interface TMDBMovie {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  popularity: number;
}

export interface TMDBMovieDetails {
  id: number;
  title: string;
  release_date: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  genres: Array<{ id: number; name: string }>;
  runtime: number;
  tagline: string;
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }>;
  };
}

export const tmdbService = {
  /**
   * Search for movies by query
   */
  async searchMovies(query: string, page: number = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const response = await tmdb.searchMovie({ query, page });
    return {
      results: response.results as TMDBMovie[],
      total_pages: response.total_pages || 0,
      total_results: response.total_results || 0,
    };
  },

  /**
   * Get popular movies
   */
  async getPopularMovies(page: number = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const response = await tmdb.moviePopular({ page });
    return {
      results: response.results as TMDBMovie[],
      total_pages: response.total_pages || 0,
      total_results: response.total_results || 0,
    };
  },

  /**
   * Get top rated movies
   */
  async getTopRatedMovies(page: number = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const response = await tmdb.movieTopRated({ page });
    return {
      results: response.results as TMDBMovie[],
      total_pages: response.total_pages || 0,
      total_results: response.total_results || 0,
    };
  },

  /**
   * Get now playing movies
   */
  async getNowPlayingMovies(page: number = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const response = await tmdb.movieNowPlaying({ page });
    return {
      results: response.results as TMDBMovie[],
      total_pages: response.total_pages || 0,
      total_results: response.total_results || 0,
    };
  },

  /**
   * Get upcoming movies
   */
  async getUpcomingMovies(page: number = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const response = await tmdb.upcomingMovies({ page });
    return {
      results: response.results as TMDBMovie[],
      total_pages: response.total_pages || 0,
      total_results: response.total_results || 0,
    };
  },

  /**
   * Get movie details by TMDB ID
   */
  async getMovieDetails(tmdbId: number): Promise<TMDBMovieDetails> {
    const [movie, credits] = await Promise.all([
      tmdb.movieInfo({ id: tmdbId }),
      tmdb.movieCredits({ id: tmdbId }),
    ]);

    return {
      ...movie,
      credits,
    } as TMDBMovieDetails;
  },

  /**
   * Get movie genres
   */
  async getGenres(): Promise<Array<{ id: number; name: string }>> {
    const response = await tmdb.genreMovieList();
    return response.genres as Array<{ id: number; name: string }>;
  },

  /**
   * Discover movies by genre
   */
  async discoverByGenre(genreId: number, page: number = 1): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const response = await tmdb.discoverMovie({
      with_genres: genreId.toString(),
      page,
    });
    return {
      results: response.results as TMDBMovie[],
      total_pages: response.total_pages || 0,
      total_results: response.total_results || 0,
    };
  },

  /**
   * Discover movies with flexible filters
   */
  async discoverMovies(filters: DiscoverMovieRequest): Promise<{ results: TMDBMovie[]; total_pages: number; total_results: number }> {
    const response = await tmdb.discoverMovie(filters);
    return {
      results: response.results as TMDBMovie[],
      total_pages: response.total_pages || 0,
      total_results: response.total_results || 0,
    };
  },

  /**
   * Get full poster URL
   */
  getPosterUrl(path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500'): string | null {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },

  /**
   * Get full backdrop URL
   */
  getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280'): string | null {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/${size}${path}`;
  },
};
