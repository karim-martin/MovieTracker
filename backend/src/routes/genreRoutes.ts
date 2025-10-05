import { Router } from 'express';
import { body } from 'express-validator';
import { getAllGenres, createGenre, deleteGenre } from '../controllers/genreController';
import { auth, adminAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validator';

const router = Router();

const genreValidation = [
  body('name').notEmpty().withMessage('Genre name is required'),
];

// Public route
router.get('/', getAllGenres);

// Admin only routes
router.post('/', auth, adminAuth, validate(genreValidation), createGenre);
router.delete('/:id', auth, adminAuth, deleteGenre);

export default router;
