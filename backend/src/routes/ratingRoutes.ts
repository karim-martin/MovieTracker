import { Router } from 'express';
import { body } from 'express-validator';
import {
  createRating,
  getMyRatings,
  getRatingByMovie,
  updateRating,
  deleteRating,
} from '../controllers/ratingController';
import { auth } from '../middlewares/auth';
import { checkBlocked } from '../middlewares/checkBlocked';
import { validate } from '../middlewares/validator';

const router = Router();

const ratingValidation = [
  body('movieId').notEmpty().withMessage('Movie ID is required'),
  body('rating')
    .isFloat({ min: 0, max: 10 })
    .withMessage('Rating must be between 0 and 10'),
  body('watchedDate').isISO8601().withMessage('Watched date must be a valid date'),
];

// All rating routes require authentication and non-blocked status
router.use(auth, checkBlocked);

router.post('/', validate(ratingValidation), createRating);
router.get('/my', getMyRatings);
router.get('/movie/:movieId', getRatingByMovie);
router.put('/:id', updateRating);
router.delete('/:id', deleteRating);

export default router;
