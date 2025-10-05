import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

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
    const { title, genre, person, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (title) {
      where.title = {
        contains: title as string,
        mode: 'insensitive',
      };
    }

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

    if (person) {
      where.credits = {
        some: {
          person: {
            name: {
              contains: person as string,
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
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
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
