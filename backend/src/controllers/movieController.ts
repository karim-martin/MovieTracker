import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { tmdbService } from '../services/tmdbService';
import { recommendationService } from '../services/recommendationService';
import logger from '../config/logger';

const prisma = new PrismaClient();

export const createMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, releaseYear, plot, posterUrl, genres, credits, externalRatings } = req.body;
    const movie = await prisma.movie.create({ data: { title, releaseYear: parseInt(releaseYear), plot, posterUrl }});

    // Add genres if provided
    if (genres && Array.isArray(genres)) {
      await Promise.all(genres.map((genreId: string) => prisma.movieGenre.create({ data: { movieId: movie.id, genreId }})));
    }

    // Add credits if provided
    if (credits && Array.isArray(credits)) {
      await Promise.all(credits.map((credit: any) => prisma.movieCredit.create({ 
        data: { movieId: movie.id, personId: credit.personId, role: credit.role, characterName: credit.characterName } })));
    }

    // Add external ratings if provided
    if (externalRatings && Array.isArray(externalRatings)) {
      await Promise.all(externalRatings.map((rating: any) => prisma.externalRating.create({ 
        data: { movieId: movie.id, source: rating.source, rating: parseFloat(rating.rating), ratingCount: rating.ratingCount ? parseInt(rating.ratingCount) : null }})));
    }

    const fullMovie = await prisma.movie.findUnique({
      where: { id: movie.id },
      include: {
        genres: { include: { genre: true } },
        credits: { include: { person: true } },
        externalRatings: true,
      },
    });

    res.status(201).json({ message: 'Movie created successfully', movie: fullMovie });
  } catch (error) {
    logger.error('Create movie error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllMovies = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { title, genre, person, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Filter by title
    if (title) { where.title = { contains: title as string, mode: 'insensitive' };}

    // Filter by genre
    if (genre) { where.genres = { some: { genre: { name: { contains: genre as string, mode: 'insensitive' }}}};}

    // Filter by person (actor, director, or producer)
    if (person) { where.credits = {some: {person: {name: {contains: person as string, mode: 'insensitive' }}}};}

    const userId = req.user?.userId;

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        include: {
          genres: { include: { genre: true } },
          credits: { include: { person: true } },
          externalRatings: true,
          userRatings: {
            select: {
              rating: true,
            },
          },
          watchStatuses: userId ? {
            where: { userId },
          } : false,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.movie.count({ where }),
    ]);

    // Transform movies to include single watchStatus instead of array
    const transformedMovies = movies.map(movie => ({
      ...movie,
      watchStatus: Array.isArray(movie.watchStatuses) && movie.watchStatuses.length > 0 ? movie.watchStatuses[0] : undefined,
      watchStatuses: undefined,
    }));

    res.status(200).json({
      movies: transformedMovies,
      pagination: { total, page: pageNum, totalPages: Math.ceil(total / limitNum)},
      source: 'local',
    });
  } catch (error) {
    logger.error('Get movies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMovieById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const movie = await prisma.movie.findUnique({
      where: { id },
      include: {
        genres: { include: { genre: true } },
        credits: { include: { person: true } },
        externalRatings: true,
        userRatings: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        watchStatuses: userId ? {
          where: { userId },
        } : false,
      },
    });

    if (!movie) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }

    // Transform to include single watchStatus
    const transformedMovie = {
      ...movie,
      watchStatus: Array.isArray(movie.watchStatuses) && movie.watchStatuses.length > 0
        ? movie.watchStatuses[0]
        : undefined,
      watchStatuses: undefined,
    };

    res.status(200).json({ movie: transformedMovie });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, releaseYear, plot, posterUrl } = req.body;

    const movie = await prisma.movie.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(releaseYear && { releaseYear: parseInt(releaseYear) }),
        ...(plot !== undefined && { plot }),
        ...(posterUrl !== undefined && { posterUrl }),
      },
      include: {
        genres: { include: { genre: true } },
        credits: { include: { person: true } },
        externalRatings: true,
      },
    });

    res.status(200).json({
      message: 'Movie updated successfully',
      movie,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.movie.delete({ where: { id } });

    res.status(200).json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { limit = '10' } = req.query;
    const limitNum = parseInt(limit as string);
    const recommendations = await recommendationService.getRecommendations( req.user.userId, limitNum );

    res.status(200).json({
      recommendations,
      message: recommendations.length > 0
        ? 'Recommendations generated based on your viewing history'
        : 'No recommendations available yet. Start rating movies!',
    });
  } catch (error) {
    logger.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const discoverMovies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { with_genres, sort_by, 'primary_release_date.gte': releaseDateGte, 'primary_release_date.lte': releaseDateLte, 
      'vote_average.gte': voteAverageGte, 'vote_average.lte': voteAverageLte, with_original_language, page = '1'} = req.query;

    const filters: any = { page: parseInt(page as string) };

    if (with_genres) filters.with_genres = with_genres as string;
    if (sort_by) filters.sort_by = sort_by as string;
    if (releaseDateGte) filters['primary_release_date.gte'] = releaseDateGte as string;
    if (releaseDateLte) filters['primary_release_date.lte'] = releaseDateLte as string;
    if (voteAverageGte) filters['vote_average.gte'] = parseFloat(voteAverageGte as string);
    if (voteAverageLte) filters['vote_average.lte'] = parseFloat(voteAverageLte as string);
    if (with_original_language) filters.with_original_language = with_original_language as string;

    const tmdbResults = await tmdbService.discoverMovies(filters);

    const movies = tmdbResults.results.map((movie) => ({ id: movie.id.toString(), tmdbId: movie.id, title: movie.title, 
      releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear() : null, plot: movie.overview, 
      posterUrl: tmdbService.getPosterUrl(movie.poster_path), backdropUrl: tmdbService.getBackdropUrl(movie.backdrop_path), 
      rating: movie.vote_average, voteCount: movie.vote_count, source: 'tmdb' as const}));

    res.status(200).json({ movies, pagination: { total: tmdbResults.total_results, page: parseInt(page as string), 
      totalPages: tmdbResults.total_pages }, source: 'tmdb', });
  } catch (error) {
    logger.error('Discover movies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
