import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const createCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, description } = req.body;
    const userId = req.user.userId;

    const collection = await prisma.collection.create({
      data: { userId, name, description },
    });

    res.status(201).json({
      message: 'Collection created successfully',
      collection,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyCollections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const collections = await prisma.collection.findMany({
      where: { userId: req.user.userId },
      include: {
        movies: {
          include: {
            movie: {
              include: {
                genres: { include: { genre: true } },
                externalRatings: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({ collections });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCollectionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        movies: {
          include: {
            movie: {
              include: {
                genres: { include: { genre: true } },
                externalRatings: true,
              },
            },
          },
        },
      },
    });

    if (!collection) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }

    // Verify ownership
    if (collection.userId !== req.user.userId) {
      res.status(403).json({ error: 'You can only view your own collections' });
      return;
    }

    res.status(200).json({ collection });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addMovieToCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { movieId } = req.body;

    // Verify ownership
    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }

    if (collection.userId !== req.user.userId) {
      res.status(403).json({ error: 'You can only modify your own collections' });
      return;
    }

    // Check if movie already in collection
    const existing = await prisma.collectionMovie.findUnique({
      where: {
        collectionId_movieId: {
          collectionId: id,
          movieId,
        },
      },
    });

    if (existing) {
      res.status(400).json({ error: 'Movie already in collection' });
      return;
    }

    await prisma.collectionMovie.create({
      data: {
        collectionId: id,
        movieId,
      },
    });

    const updatedCollection = await prisma.collection.findUnique({
      where: { id },
      include: {
        movies: {
          include: {
            movie: true,
          },
        },
      },
    });

    res.status(200).json({
      message: 'Movie added to collection',
      collection: updatedCollection,
    });
  } catch (error) {
    console.error('Add movie to collection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeMovieFromCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id, movieId } = req.params;

    // Verify ownership
    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }

    if (collection.userId !== req.user.userId) {
      res.status(403).json({ error: 'You can only modify your own collections' });
      return;
    }

    await prisma.collectionMovie.delete({
      where: {
        collectionId_movieId: {
          collectionId: id,
          movieId,
        },
      },
    });

    res.status(200).json({ message: 'Movie removed from collection' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCollection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    // Verify ownership
    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) {
      res.status(404).json({ error: 'Collection not found' });
      return;
    }

    if (collection.userId !== req.user.userId) {
      res.status(403).json({ error: 'You can only delete your own collections' });
      return;
    }

    await prisma.collection.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Collection deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
