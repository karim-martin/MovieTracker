import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const getAllGenres = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ genres });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createGenre = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    const existingGenre = await prisma.genre.findUnique({
      where: { name },
    });

    if (existingGenre) {
      res.status(400).json({ error: 'Genre already exists' });
      return;
    }

    const genre = await prisma.genre.create({
      data: { name },
    });

    res.status(201).json({
      message: 'Genre created successfully',
      genre,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteGenre = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.genre.delete({
      where: { id },
    });

    res.status(200).json({ message: 'Genre deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
