import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import expressWinston from 'express-winston';
import winston from 'winston';
import { errorHandler } from './middlewares/errorHandler';
import { setupSwagger } from './config/swagger';
import logger from './config/logger';

// Import routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import movieRoutes from './routes/movieRoutes';
import genreRoutes from './routes/genreRoutes';
import personRoutes from './routes/personRoutes';
import ratingRoutes from './routes/ratingRoutes';

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

// HTTP request logging (before routes)
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
  ignoreRoute: (req) => {
    // Skip logging for health check
    return req.url === '/health';
  },
}));

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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
