import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

// Toggle watch status for a movie
export const toggleWatchStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const userId = req.user?.userId;
    const { watched, watchedDate } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Check if movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }

    // Check if watch status already exists
    const existingStatus = await prisma.watchStatus.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    let watchStatus;
    if (existingStatus) {
      // Update existing watch status
      watchStatus = await prisma.watchStatus.update({
        where: { id: existingStatus.id },
        data: {
          watched: watched ?? !existingStatus.watched,
          watchedDate: watchedDate ? new Date(watchedDate) : existingStatus.watchedDate,
        },
      });
    } else {
      // Create new watch status
      watchStatus = await prisma.watchStatus.create({
        data: {
          movieId,
          userId,
          watched: watched ?? true,
          watchedDate: watchedDate ? new Date(watchedDate) : new Date(),
        },
      });
    }

    res.status(200).json({ watchStatus });
  } catch (error) {
    console.error('Error toggling watch status:', error);
    res.status(500).json({ error: 'Failed to toggle watch status' });
  }
};

// Get watch status for a movie
export const getWatchStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const watchStatus = await prisma.watchStatus.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    res.status(200).json({ watchStatus });
  } catch (error) {
    console.error('Error getting watch status:', error);
    res.status(500).json({ error: 'Failed to get watch status' });
  }
};

// Get all watched movies for current user
export const getMyWatchedMovies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const watchStatuses = await prisma.watchStatus.findMany({
      where: {
        userId,
        watched: true,
      },
      include: {
        movie: {
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
            credits: {
              include: {
                person: true,
              },
            },
            externalRatings: true,
            userRatings: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: {
        watchedDate: 'desc',
      },
    });

    const movies = watchStatuses.map(ws => ws.movie);

    res.status(200).json({ movies });
  } catch (error) {
    console.error('Error getting watched movies:', error);
    res.status(500).json({ error: 'Failed to get watched movies' });
  }
};

// Get all movies for current user (rated OR watched)
export const getMyMovies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get all movies that user has either rated or watched
    const [watchStatuses, ratings] = await Promise.all([
      prisma.watchStatus.findMany({
        where: {
          userId,
          watched: true,
        },
        include: {
          movie: {
            include: {
              genres: {
                include: {
                  genre: true,
                },
              },
              credits: {
                include: {
                  person: true,
                },
              },
              externalRatings: true,
            },
          },
        },
      }),
      prisma.userRating.findMany({
        where: {
          userId,
        },
        include: {
          movie: {
            include: {
              genres: {
                include: {
                  genre: true,
                },
              },
              credits: {
                include: {
                  person: true,
                },
              },
              externalRatings: true,
            },
          },
        },
      }),
    ]);

    // Create a map to combine movies with their watch status, rating, and most recent date
    const movieMap = new Map();

    // Add watched movies
    watchStatuses.forEach(ws => {
      movieMap.set(ws.movieId, {
        ...ws.movie,
        watchStatus: {
          watched: ws.watched,
          watchedDate: ws.watchedDate,
          updatedAt: ws.updatedAt,
        },
        userRating: undefined,
        lastActionDate: ws.updatedAt,
      });
    });

    // Add or update with rated movies
    ratings.forEach(rating => {
      const existing = movieMap.get(rating.movieId);
      const ratingData = {
        id: rating.id,
        rating: rating.rating,
        watchedDate: rating.watchedDate,
        updatedAt: rating.updatedAt,
      };

      if (existing) {
        // Movie is both watched and rated - use most recent date
        const ratingDate = new Date(rating.updatedAt);
        const watchDate = new Date(existing.lastActionDate);
        movieMap.set(rating.movieId, {
          ...existing,
          userRating: ratingData,
          lastActionDate: ratingDate > watchDate ? rating.updatedAt : existing.lastActionDate,
        });
      } else {
        // Movie is only rated
        movieMap.set(rating.movieId, {
          ...rating.movie,
          watchStatus: undefined,
          userRating: ratingData,
          lastActionDate: rating.updatedAt,
        });
      }
    });

    // Convert map to array and sort by most recent action
    const movies = Array.from(movieMap.values()).sort((a, b) => {
      return new Date(b.lastActionDate).getTime() - new Date(a.lastActionDate).getTime();
    });

    res.status(200).json({ movies });
  } catch (error) {
    console.error('Error getting my movies:', error);
    res.status(500).json({ error: 'Failed to get my movies' });
  }
};

// Delete watch status
export const deleteWatchStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { movieId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const watchStatus = await prisma.watchStatus.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    if (!watchStatus) {
      res.status(404).json({ error: 'Watch status not found' });
      return;
    }

    await prisma.watchStatus.delete({
      where: { id: watchStatus.id },
    });

    res.status(200).json({ message: 'Watch status deleted successfully' });
  } catch (error) {
    console.error('Error deleting watch status:', error);
    res.status(500).json({ error: 'Failed to delete watch status' });
  }
};
