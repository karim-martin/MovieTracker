import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';

const prisma = new PrismaClient();

export const getAllPeople = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type } = req.query;
    const where: any = {};

    if (name) { where.name = { contains: name as string, mode: 'insensitive' };}
    if (type) { where.type = type as string;}

    const people = await prisma.person.findMany({ where, orderBy: { name: 'asc' }});

    res.status(200).json({ people });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createPerson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type } = req.body;

    const person = await prisma.person.create({ data: { name, type,} });

    res.status(201).json({ message: 'Person created successfully', person });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deletePerson = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.person.delete({ where: { id } });

    res.status(200).json({ message: 'Person deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};
