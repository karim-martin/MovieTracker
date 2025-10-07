import { Router } from 'express';
import {
  searchTMDBMovies,
  getPopularTMDBMovies,
  getTMDBMovieDetails,
  importTMDBMovie,
  bulkImportPopular,
} from '../controllers/tmdbController';
import { auth, adminAuth } from '../middlewares/auth';

const router = Router();

// All TMDB routes require admin authentication
router.use(auth, adminAuth);

// Search TMDB movies
router.get('/search', searchTMDBMovies);

// Get popular TMDB movies
router.get('/popular', getPopularTMDBMovies);

// Get TMDB movie details
router.get('/movie/:tmdbId', getTMDBMovieDetails);

// Import single movie from TMDB
router.post('/import', importTMDBMovie);

// Bulk import popular movies
router.post('/import/bulk', bulkImportPopular);

export default router;
