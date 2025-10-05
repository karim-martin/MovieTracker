import { Router } from 'express';
import { body } from 'express-validator';
import {
  createMovie,
  getAllMovies,
  getMovieById,
  updateMovie,
  deleteMovie,
  getRecommendations,
} from '../controllers/movieController';
import { auth, adminAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validator';

const router = Router();

/**
 * @openapi
 * tags:
 *   name: Movies
 *   description: Movie management endpoints
 */

// Movie validation
const movieValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('releaseYear')
    .isInt({ min: 1800, max: 2100 })
    .withMessage('Release year must be a valid year'),
];

/**
 * @openapi
 * /api/movies:
 *   get:
 *     tags: [Movies]
 *     summary: Get all movies
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search movies by title
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter by genre
 *     responses:
 *       200:
 *         description: List of movies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Movie'
 */
router.get('/', getAllMovies);

/**
 * @openapi
 * /api/movies/recommendations:
 *   get:
 *     tags: [Movies]
 *     summary: Get personalized movie recommendations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recommendations to return
 *     responses:
 *       200:
 *         description: List of recommended movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Movie'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */
router.get('/recommendations', auth, getRecommendations);

/**
 * @openapi
 * /api/movies/{id}:
 *   get:
 *     tags: [Movies]
 *     summary: Get movie by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Movie details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movie'
 *       404:
 *         description: Movie not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getMovieById);

/**
 * @openapi
 * /api/movies:
 *   post:
 *     tags: [Movies]
 *     summary: Create a new movie (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - releaseYear
 *             properties:
 *               title:
 *                 type: string
 *               releaseYear:
 *                 type: integer
 *                 minimum: 1800
 *                 maximum: 2100
 *               plot:
 *                 type: string
 *               posterUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Movie created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movie'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post('/', auth, adminAuth, validate(movieValidation), createMovie);

/**
 * @openapi
 * /api/movies/{id}:
 *   put:
 *     tags: [Movies]
 *     summary: Update movie (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               releaseYear:
 *                 type: integer
 *               plot:
 *                 type: string
 *               posterUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Movie updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Movie'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Movie not found
 */
router.put('/:id', auth, adminAuth, updateMovie);

/**
 * @openapi
 * /api/movies/{id}:
 *   delete:
 *     tags: [Movies]
 *     summary: Delete movie (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Movie deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Movie not found
 */
router.delete('/:id', auth, adminAuth, deleteMovie);

export default router;
