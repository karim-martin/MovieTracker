import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { tmdbService } from '../services/tmdbService';

const prisma = new PrismaClient();

export const createMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, releaseYear, plot, posterUrl, genres, credits, externalRatings } = req.body;

    const movie = await prisma.movie.create({
      data: {
        title,
        releaseYear: parseInt(releaseYear),
        plot,
        posterUrl,
      },
    });

    // Add genres if provided
    if (genres && Array.isArray(genres)) {
      await Promise.all(
        genres.map((genreId: string) =>
          prisma.movieGenre.create({
            data: {
              movieId: movie.id,
              genreId,
            },
          })
        )
      );
    }

    // Add credits if provided
    if (credits && Array.isArray(credits)) {
      await Promise.all(
        credits.map((credit: any) =>
          prisma.movieCredit.create({
            data: {
              movieId: movie.id,
              personId: credit.personId,
              role: credit.role,
              characterName: credit.characterName,
            },
          })
        )
      );
    }

    // Add external ratings if provided
    if (externalRatings && Array.isArray(externalRatings)) {
      await Promise.all(
        externalRatings.map((rating: any) =>
          prisma.externalRating.create({
            data: {
              movieId: movie.id,
              source: rating.source,
              rating: parseFloat(rating.rating),
              ratingCount: rating.ratingCount ? parseInt(rating.ratingCount) : null,
            },
          })
        )
      );
    }

    const fullMovie = await prisma.movie.findUnique({
      where: { id: movie.id },
      include: {
        genres: { include: { genre: true } },
        credits: { include: { person: true } },
        externalRatings: true,
      },
    });

    res.status(201).json({
      message: 'Movie created successfully',
      movie: fullMovie,
    });
  } catch (error) {
    console.error('Create movie error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllMovies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, genre, source = 'tmdb', page = '1' } = req.query;
    const pageNum = parseInt(page as string);

    // If searching by title or source is TMDB, fetch from TMDB
    if (source === 'tmdb' || title) {
      let tmdbResults;

      if (title) {
        // Search TMDB by title
        tmdbResults = await tmdbService.searchMovies(title as string, pageNum);
      } else if (genre) {
        // Get TMDB genres first, find matching genre ID
        const genres = await tmdbService.getGenres();
        const matchedGenre = genres.find(g =>
          g.name.toLowerCase().includes((genre as string).toLowerCase())
        );

        if (matchedGenre) {
          tmdbResults = await tmdbService.discoverByGenre(matchedGenre.id, pageNum);
        } else {
          tmdbResults = await tmdbService.getPopularMovies(pageNum);
        }
      } else {
        // Get popular movies by default
        tmdbResults = await tmdbService.getPopularMovies(pageNum);
      }

      // Format TMDB results with image URLs
      const movies = tmdbResults.results.map((movie) => ({
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
      }));

      return res.status(200).json({
        movies,
        pagination: {
          total: tmdbResults.total_results,
          page: pageNum,
          totalPages: tmdbResults.total_pages,
        },
        source: 'tmdb',
      });
    }

    // Otherwise, fetch from local database
    const limitNum = 20;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (genre) {
      where.genres = {
        some: {
          genre: {
            name: {
              contains: genre as string,
              mode: 'insensitive',
            },
          },
        },
      };
    }

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
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.movie.count({ where }),
    ]);

    res.status(200).json({
      movies,
      pagination: {
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      },
      source: 'local',
    });
  } catch (error) {
    console.error('Get movies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMovieById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

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
      },
    });

    if (!movie) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }

    res.status(200).json({ movie });
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

    await prisma.movie.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Movie deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
