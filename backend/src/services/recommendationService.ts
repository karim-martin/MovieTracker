import logger from '../config/logger';
import { PrismaClient } from '@prisma/client';

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

      // Get top genres (at least 60% of max score)
      const maxScore = Math.max(...genreScores.map(g => g.score));
      const topGenreIds = genreScores
        .filter(g => g.score >= maxScore * 0.6)
        .slice(0, 3)
        .map(g => g.genreId.toString());

      // Get movie IDs user has already rated to exclude them
      const ratedMovieIds = new Set(userRatings.map(r => r.movie.id));

      // Fetch recommendations from local database based on preferred genres
      const candidateMovies = await prisma.movie.findMany({
        where: {
          // Exclude already rated movies
          id: {
            notIn: Array.from(ratedMovieIds),
          },
          // Only movies in user's preferred genres
          genres: topGenreIds.length > 0 ? {
            some: {
              genreId: {
                in: topGenreIds,
              },
            },
          } : undefined,
        },
        include: {
          genres: {
            include: { genre: true },
          },
          userRatings: true,
          externalRatings: true,
        },
        take: limit * 3, // Get more candidates to filter and rank
      });

      // If no movies match preferences, return empty array
      if (candidateMovies.length === 0) {
        return [];
      }

      // Convert to recommendation format and calculate scores
      const recommendations: RecommendationMovie[] = candidateMovies.map(movie => {
        // Calculate average user rating for this movie
        const avgRating = movie.userRatings.length > 0
          ? movie.userRatings.reduce((sum, r) => sum + r.rating, 0) / movie.userRatings.length
          : movie.externalRatings[0]?.rating || 5;

        // Find matching genre
        const matchingGenre = genreScores.find(gs =>
          movie.genres.some(mg => mg.genreId === gs.genreId.toString())
        );

        return {
          id: movie.id,
          tmdbId: movie.tmdbId || 0,
          title: movie.title,
          releaseYear: movie.releaseYear,
          plot: movie.plot || '',
          posterUrl: movie.posterUrl,
          backdropUrl: null,
          rating: avgRating,
          voteCount: movie.userRatings.length,
          source: 'tmdb' as const,
          recommendationReason: matchingGenre
            ? `Recommended based on your interest in ${matchingGenre.genreName}`
            : 'Recommended for you',
          recommendationScore: avgRating * (matchingGenre?.score || 0.5),
        };
      });

      // Sort by recommendation score
      recommendations.sort((a, b) => (b.recommendationScore || 0) - (a.recommendationScore || 0));

      return recommendations.slice(0, limit);
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
   * Get popular movies from local database as fallback recommendations
   */
  async getPopularMoviesAsRecommendations(limit: number): Promise<RecommendationMovie[]> {
    try {
      // Get movies from local database ordered by average rating and rating count
      const movies = await prisma.movie.findMany({
        include: {
          userRatings: true,
          externalRatings: true,
        },
        take: limit * 2, // Get more to filter and sort
      });

      // If no movies in database, return empty array
      if (movies.length === 0) {
        return [];
      }

      // Calculate average rating for each movie and sort
      const moviesWithScores = movies.map(movie => {
        const userRatings = movie.userRatings;
        const avgUserRating = userRatings.length > 0
          ? userRatings.reduce((sum, r) => sum + r.rating, 0) / userRatings.length
          : 0;

        // Use external ratings if available (IMDB or Rotten Tomatoes)
        const externalRating = movie.externalRatings[0]?.rating || 0;

        // Combined score: prioritize user ratings, fall back to external ratings
        const score = userRatings.length > 0 ? avgUserRating : externalRating;
        const ratingCount = userRatings.length;

        return {
          movie,
          score,
          ratingCount,
        };
      });

      // Sort by score and rating count, then take the top results
      const sortedMovies = moviesWithScores
        .sort((a, b) => {
          // First sort by score
          if (b.score !== a.score) return b.score - a.score;
          // Then by rating count
          return b.ratingCount - a.ratingCount;
        })
        .slice(0, limit);

      return sortedMovies.map(({ movie }) => ({
        id: movie.id,
        tmdbId: movie.tmdbId || 0,
        title: movie.title,
        releaseYear: movie.releaseYear,
        plot: movie.plot || '',
        posterUrl: movie.posterUrl,
        backdropUrl: null,
        rating: 0,
        voteCount: 0,
        source: 'tmdb' as const, // Keep for compatibility, but it's from local DB
        recommendationReason: 'Popular movie you might enjoy',
      }));
    } catch (error) {
      logger.error('Error fetching popular movies from database:', error);
      return [];
    }
  },
};
