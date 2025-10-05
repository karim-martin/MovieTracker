import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import app from './app';
import { seedAdminUser } from './services/seedService';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

// Test database connection and seed admin
const initializeServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Seed admin user
    await seedAdminUser();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

initializeServer();
