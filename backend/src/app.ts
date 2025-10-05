import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/errorHandler';
import { setupSwagger } from './config/swagger';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import movieRoutes from './routes/movieRoutes';
import genreRoutes from './routes/genreRoutes';
import personRoutes from './routes/personRoutes';
import ratingRoutes from './routes/ratingRoutes';
import collectionRoutes from './routes/collectionRoutes';
import tmdbRoutes from './routes/tmdbRoutes';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Swagger Documentation
setupSwagger(app);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/people', personRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/tmdb', tmdbRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
