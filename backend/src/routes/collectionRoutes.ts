import { Router } from 'express';
import { body } from 'express-validator';
import {
  createCollection,
  getMyCollections,
  getCollectionById,
  addMovieToCollection,
  removeMovieFromCollection,
  deleteCollection,
} from '../controllers/collectionController';
import { auth } from '../middlewares/auth';
import { checkBlocked } from '../middlewares/checkBlocked';
import { validate } from '../middlewares/validator';

const router = Router();

const collectionValidation = [
  body('name').notEmpty().withMessage('Collection name is required'),
];

const addMovieValidation = [
  body('movieId').notEmpty().withMessage('Movie ID is required'),
];

// All collection routes require authentication and non-blocked status
router.use(auth, checkBlocked);

router.post('/', validate(collectionValidation), createCollection);
router.get('/my', getMyCollections);
router.get('/:id', getCollectionById);
router.post('/:id/movies', validate(addMovieValidation), addMovieToCollection);
router.delete('/:id/movies/:movieId', removeMovieFromCollection);
router.delete('/:id', deleteCollection);

export default router;
