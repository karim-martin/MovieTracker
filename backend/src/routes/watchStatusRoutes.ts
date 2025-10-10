import { Router } from 'express';
import {
  toggleWatchStatus,
  getWatchStatus,
  getMyWatchedMovies,
  getMyMovies,
  deleteWatchStatus,
} from '../controllers/watchStatusController';
import { auth } from '../middlewares/auth';
import { checkBlocked } from '../middlewares/checkBlocked';

const router = Router();

// All routes require authentication and non-blocked status
router.use(auth, checkBlocked);

// Get all movies for current user (rated OR watched)
router.get('/my-movies', getMyMovies);

// Get all watched movies for current user
router.get('/my', getMyWatchedMovies);

// Get watch status for a specific movie
router.get('/:movieId', getWatchStatus);

// Toggle/update watch status for a movie
router.post('/:movieId', toggleWatchStatus);

// Delete watch status
router.delete('/:movieId', deleteWatchStatus);

export default router;
