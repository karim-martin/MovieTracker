import { Router } from 'express';
import { body } from 'express-validator';
import {
  createMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
} from '../controllers/movieController';
import { auth } from '../middlewares/auth';
import { adminAuth } from '../middlewares/adminAuth';
import { validate } from '../middlewares/validator';

const router = Router();

// Movie validation
const movieValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('releaseYear')
    .isInt({ min: 1800, max: 2100 })
    .withMessage('Release year must be a valid year'),
];

// Public routes
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

// Admin only routes
router.post('/', auth, adminAuth, validate(movieValidation), createMovie);
router.put('/:id', auth, adminAuth, updateMovie);
router.delete('/:id', auth, adminAuth, deleteMovie);

export default router;
