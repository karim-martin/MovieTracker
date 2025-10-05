import { Router } from 'express';
import {
  searchMovies,
  getPopularMovies,
  getTopRatedMovies,
  getNowPlayingMovies,
  getUpcomingMovies,
  getMovieDetails,
  getGenres,
  discoverByGenre,
  importMovieFromTMDB,
} from '../controllers/tmdbController';
import { auth, adminAuth } from '../middlewares/auth';

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: TMDB
 *     description: TMDB movie database integration
 */

/**
 * @openapi
 * /api/tmdb/search:
 *   get:
 *     tags: [TMDB]
 *     summary: Search movies on TMDB
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Search results from TMDB
 *       400:
 *         description: Search query is required
 */
router.get('/search', searchMovies);

/**
 * @openapi
 * /api/tmdb/popular:
 *   get:
 *     tags: [TMDB]
 *     summary: Get popular movies from TMDB
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Popular movies from TMDB
 */
router.get('/popular', getPopularMovies);

/**
 * @openapi
 * /api/tmdb/top-rated:
 *   get:
 *     tags: [TMDB]
 *     summary: Get top rated movies from TMDB
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Top rated movies from TMDB
 */
router.get('/top-rated', getTopRatedMovies);

/**
 * @openapi
 * /api/tmdb/now-playing:
 *   get:
 *     tags: [TMDB]
 *     summary: Get now playing movies from TMDB
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Now playing movies from TMDB
 */
router.get('/now-playing', getNowPlayingMovies);

/**
 * @openapi
 * /api/tmdb/upcoming:
 *   get:
 *     tags: [TMDB]
 *     summary: Get upcoming movies from TMDB
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Upcoming movies from TMDB
 */
router.get('/upcoming', getUpcomingMovies);

/**
 * @openapi
 * /api/tmdb/genres:
 *   get:
 *     tags: [TMDB]
 *     summary: Get movie genres from TMDB
 *     responses:
 *       200:
 *         description: List of movie genres
 */
router.get('/genres', getGenres);

/**
 * @openapi
 * /api/tmdb/discover/genre/{genreId}:
 *   get:
 *     tags: [TMDB]
 *     summary: Discover movies by genre from TMDB
 *     parameters:
 *       - in: path
 *         name: genreId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Genre ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: Movies filtered by genre
 */
router.get('/discover/genre/:genreId', discoverByGenre);

/**
 * @openapi
 * /api/tmdb/movie/{id}:
 *   get:
 *     tags: [TMDB]
 *     summary: Get movie details from TMDB
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB movie ID
 *     responses:
 *       200:
 *         description: Movie details from TMDB
 */
router.get('/movie/:id', getMovieDetails);

/**
 * @openapi
 * /api/tmdb/import/{id}:
 *   post:
 *     tags: [TMDB]
 *     summary: Import a movie from TMDB to local database (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: TMDB movie ID
 *     responses:
 *       201:
 *         description: Movie imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movie'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       409:
 *         description: Movie already exists
 */
router.post('/import/:id', auth, adminAuth, importMovieFromTMDB);

export default router;
