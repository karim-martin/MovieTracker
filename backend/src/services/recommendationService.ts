import logger from '../config/logger';
import { PrismaClient } from '@prisma/client';
import { tmdbService, TMDBMovie } from './tmdbService';

const prisma = new PrismaClient();

interface GenreScore {
  genreId: number;
  genreName: string;
  score: number;
}

interface RecommendationMovie {
  id: string;
  tmdbId: number;
  title: string;
  releaseYear: number;
  plot: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  voteCount: number;
  source: 'tmdb';
  recommendationScore?: number;
  recommendationReason?: string;
}

export const recommendationService = {
  /**
   * Get personalized movie recommendations based on user's viewing history
   * Uses a hybrid approach:
   * 1. Analyzes user's rated movies to find preferred genres
   * 2. Considers highly-rated movies to understand preferences
   * 3. Fetches similar movies from TMDB based on these preferences
   * 4. Scores and ranks recommendations
   */
  async getRecommendations(userId: string, limit: number = 10): Promise<RecommendationMovie[]> {
    try {
      // Get user's ratings with movie details
      const userRatings = await prisma.userRating.findMany({
        where: { userId },
        include: {
          movie: {
            include: {
              genres: {
                include: { genre: true },
              },
            },
          },
        },
        orderBy: { rating: 'desc' },
      });

      // If user has no ratings, return popular movies
      if (userRatings.length === 0) {
        return this.getPopularMoviesAsRecommendations(limit);
      }

      // Analyze user preferences
      const genreScores = this.calculateGenrePreferences(userRatings);
      const averageUserRating = userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length;

      // Get top genres (at least 60% of max score)
      const maxScore = Math.max(...genreScores.map(g => g.score));
      const topGenres = genreScores
        .filter(g => g.score >= maxScore * 0.6)
        .slice(0, 3)
        .map(g => g.genreId);

      // Get movie IDs user has already rated to exclude them
      // Note: Local movies don't have tmdbId, so this set will be empty for local movies
      const ratedMovieIds = new Set<number>();

      // Fetch recommendations from TMDB for each top genre
      const recommendations: RecommendationMovie[] = [];

      for (const genreId of topGenres) {
        try {
          const tmdbResults = await tmdbService.discoverByGenre(genreId, 1);

          // Filter out already rated movies and convert to our format
          const genreRecommendations = tmdbResults.results
            .filter(movie => !ratedMovieIds.has(movie.id))
            .slice(0, 5)
            .map(movie => this.convertTMDBToRecommendation(movie, genreId, genreScores));

          recommendations.push(...genreRecommendations);
        } catch (error) {
          logger.error(`Error fetching recommendations for genre ${genreId}:`, error);
        }
      }

      // If user has high-rated movies, also get similar movies
      // Note: This feature requires movies to have tmdbId, which is not in the current schema
      // Commenting out until schema is updated to include tmdbId field
      // const highlyRatedMovies = userRatings.filter(r => r.rating >= averageUserRating && r.rating >= 7);
      // if (highlyRatedMovies.length > 0 && recommendations.length < limit) {
      //   for (const rating of highlyRatedMovies.slice(0, 2)) {
      //     if (rating.movie.tmdbId) {
      //       try {
      //         const similarMovies = await this.getSimilarMovies(rating.movie.tmdbId);
      //         const filtered = similarMovies
      //           .filter(movie => !ratedMovieIds.has(movie.id))
      //           .slice(0, 3)
      //           .map(movie => ({
      //             ...this.convertTMDBToRecommendation(movie, 0, genreScores),
      //             recommendationReason: `Because you liked "${rating.movie.title}"`,
      //           }));
      //         recommendations.push(...filtered);
      //       } catch (error) {
      //         logger.error(`Error fetching similar movies for ${rating.movie.tmdbId}:`, error);
      //       }
      //     }
      //   }
      // }

      // Score and rank recommendations
      const scoredRecommendations = recommendations.map(movie => ({
        ...movie,
        recommendationScore: this.calculateRecommendationScore(movie, genreScores, averageUserRating),
      }));

      // Remove duplicates and sort by score
      const uniqueRecommendations = this.removeDuplicates(scoredRecommendations);
      uniqueRecommendations.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));

      return uniqueRecommendations.slice(0, limit);
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      // Fallback to popular movies
      return this.getPopularMoviesAsRecommendations(limit);
    }
  },

  /**
   * Calculate genre preferences based on user ratings
   * Higher-rated movies contribute more to genre scores
   */
  calculateGenrePreferences(userRatings: any[]): GenreScore[] {
    const genreScoreMap = new Map<number, { name: string; score: number; count: number }>();

    for (const userRating of userRatings) {
      const weight = userRating.rating / 10; // Normalize rating to 0-1 scale

      for (const movieGenre of userRating.movie.genres || []) {
        const genreId = parseInt(movieGenre.genre.id);
        const genreName = movieGenre.genre.name;

        const current = genreScoreMap.get(genreId) || { name: genreName, score: 0, count: 0 };
        genreScoreMap.set(genreId, {
          name: genreName,
          score: current.score + weight,
          count: current.count + 1,
        });
      }
    }

    // Convert to array and calculate average scores
    const genreScores: GenreScore[] = Array.from(genreScoreMap.entries()).map(([genreId, data]) => ({
      genreId,
      genreName: data.name,
      score: data.score / data.count, // Average score
    }));

    return genreScores.sort((a, b) => b.score - a.score);
  },

  /**
   * Get similar movies from TMDB
   */
  async getSimilarMovies(tmdbId: number): Promise<TMDBMovie[]> {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${tmdbId}/similar?api_key=${process.env.TMDB_API_KEY}`
      );
      const data = await response.json() as { results?: TMDBMovie[] };
      return data.results || [];
    } catch (error) {
      logger.error('Error fetching similar movies:', error);
      return [];
    }
  },

  /**
   * Convert TMDB movie to recommendation format
   */
  convertTMDBToRecommendation(movie: TMDBMovie, genreId: number, genreScores: GenreScore[]): RecommendationMovie {
    const genreInfo = genreScores.find(g => g.genreId === genreId);

    return {
      id: movie.id.toString(),
      tmdbId: movie.id,
      title: movie.title,
      releaseYear: new Date(movie.release_date).getFullYear(),
      plot: movie.overview,
      posterUrl: tmdbService.getPosterUrl(movie.poster_path),
      backdropUrl: tmdbService.getBackdropUrl(movie.backdrop_path),
      rating: movie.vote_average,
      voteCount: movie.vote_count,
      source: 'tmdb' as const,
      recommendationReason: genreInfo ? `Recommended based on your interest in ${genreInfo.genreName}` : undefined,
    };
  },

  /**
   * Calculate recommendation score based on multiple factors
   */
  calculateRecommendationScore(
    movie: RecommendationMovie,
    genreScores: GenreScore[],
    averageUserRating: number
  ): number {
    let score = 0;

    // Factor 1: TMDB rating (0-40 points)
    score += (movie.rating / 10) * 40;

    // Factor 2: Popularity based on vote count (0-20 points)
    const voteScore = Math.min(movie.voteCount / 100, 20);
    score += voteScore;

    // Factor 3: Genre preference alignment (0-40 points)
    // This would require genre_ids from TMDB response
    // For now, we add a base score
    score += 20;

    return score;
  },

  /**
   * Remove duplicate movies
   */
  removeDuplicates(movies: RecommendationMovie[]): RecommendationMovie[] {
    const seen = new Set<number>();
    const unique: RecommendationMovie[] = [];

    for (const movie of movies) {
      if (!seen.has(movie.tmdbId)) {
        seen.add(movie.tmdbId);
        unique.push(movie);
      }
    }

    return unique;
  },

  /**
   * Get popular movies as fallback recommendations
   */
  async getPopularMoviesAsRecommendations(limit: number): Promise<RecommendationMovie[]> {
    try {
      const tmdbResults = await tmdbService.getPopularMovies(1);

      return tmdbResults.results.slice(0, limit).map(movie => ({
        id: movie.id.toString(),
        tmdbId: movie.id,
        title: movie.title,
        releaseYear: new Date(movie.release_date).getFullYear(),
        plot: movie.overview,
        posterUrl: tmdbService.getPosterUrl(movie.poster_path),
        backdropUrl: tmdbService.getBackdropUrl(movie.backdrop_path),
        rating: movie.vote_average,
        voteCount: movie.vote_count,
        source: 'tmdb' as const,
        recommendationReason: 'Popular movie you might enjoy',
      }));
    } catch (error) {
      logger.error('Error fetching popular movies:', error);
      return [];
    }
  },
};
