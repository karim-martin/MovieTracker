import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import app from './app';
import { seedAdminUser } from './services/seedService';
import logger from './config/logger';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Test database connection and seed admin
const initializeServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Seed admin user
    await seedAdminUser();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  logger.info('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\nShutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

initializeServer();
