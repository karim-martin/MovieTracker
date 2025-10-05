import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const createRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { movieId, rating, review, watchedDate } = req.body;
    const userId = req.user.userId;

    // Check if user already rated this movie
    const existingRating = await prisma.userRating.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
    });

    if (existingRating) {
      res.status(400).json({ error: 'You have already rated this movie. Use update instead.' });
      return;
    }

    const userRating = await prisma.userRating.create({
      data: {
        movieId,
        userId,
        rating: parseFloat(rating),
        review,
        watchedDate: new Date(watchedDate),
      },
      include: {
        movie: true,
      },
    });

    res.status(201).json({
      message: 'Rating created successfully',
      rating: userRating,
    });
  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyRatings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const ratings = await prisma.userRating.findMany({
      where: { userId: req.user.userId },
      include: {
        movie: {
          include: {
            genres: { include: { genre: true } },
            externalRatings: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ ratings });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRatingByMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { movieId } = req.params;
    const userId = req.user.userId;

    const rating = await prisma.userRating.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        },
      },
      include: {
        movie: true,
      },
    });

    if (!rating) {
      res.status(404).json({ error: 'Rating not found' });
      return;
    }

    res.status(200).json({ rating });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { rating, review, watchedDate } = req.body;

    // Verify ownership
    const existingRating = await prisma.userRating.findUnique({
      where: { id },
    });

    if (!existingRating) {
      res.status(404).json({ error: 'Rating not found' });
      return;
    }

    if (existingRating.userId !== req.user.userId) {
      res.status(403).json({ error: 'You can only update your own ratings' });
      return;
    }

    const updatedRating = await prisma.userRating.update({
      where: { id },
      data: {
        ...(rating && { rating: parseFloat(rating) }),
        ...(review !== undefined && { review }),
        ...(watchedDate && { watchedDate: new Date(watchedDate) }),
      },
      include: {
        movie: true,
      },
    });

    res.status(200).json({
      message: 'Rating updated successfully',
      rating: updatedRating,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteRating = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    // Verify ownership
    const existingRating = await prisma.userRating.findUnique({
      where: { id },
    });

    if (!existingRating) {
      res.status(404).json({ error: 'Rating not found' });
      return;
    }

    if (existingRating.userId !== req.user.userId) {
      res.status(403).json({ error: 'You can only delete your own ratings' });
      return;
    }

    await prisma.userRating.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Rating deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
