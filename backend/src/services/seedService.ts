import logger from '../config/logger';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from './authService';

const prisma = new PrismaClient();

export const seedAdminUser = async (): Promise<void> => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@movietracker.com';
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { email: adminEmail },
          { role: 'ADMIN' },
        ],
      },
    });

    if (existingAdmin) {
      logger.info('Admin user already exists');
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword(adminPassword);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        role: 'ADMIN',
        isBlocked: false,
      },
    });

    logger.info('Admin user created successfully');
    logger.info(`   Email: ${admin.email}`);
    logger.info(`   Username: ${admin.username}`);
    logger.info(`   Default Password: ${adminPassword}`);
    logger.info('   WARNING: Please change the default password after first login');
  } catch (error) {
    logger.error('Error seeding admin user:', error);
    throw error;
  }
};
