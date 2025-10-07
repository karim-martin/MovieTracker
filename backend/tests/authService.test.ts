import { PrismaClient } from '@prisma/client';
import {
  hashPassword,
  comparePassword,
  registerUser,
  loginUser,
  getUserById,
} from '../src/services/authService';
import * as jwt from '../src/utils/jwt';

const prisma = new PrismaClient();

// Mock JWT functions
jest.mock('../src/utils/jwt', () => ({
  generateToken: jest.fn(() => 'mock-token'),
  verifyToken: jest.fn(),
}));

describe('AuthService', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'authservice-test',
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'TestPassword123';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword(password, hashed);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123';
      const hashed = await hashPassword(password);
      const isMatch = await comparePassword('WrongPassword', hashed);

      expect(isMatch).toBe(false);
    });
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'authservice-test1@example.com',
        username: 'authtest1',
        password: 'Test123',
      };

      const result = await registerUser(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.username).toBe(userData.username);
      expect(result.user).not.toHaveProperty('password');
      expect(result.token).toBe('mock-token');
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'authservice-test2@example.com',
        username: 'authtest2',
        password: 'Test123',
      };

      await registerUser(userData);

      await expect(
        registerUser({
          email: 'authservice-test2@example.com',
          username: 'different',
          password: 'Test123',
        })
      ).rejects.toThrow('User with this email or username already exists');
    });

    it('should throw error for duplicate username', async () => {
      const userData = {
        email: 'authservice-test3@example.com',
        username: 'authtest3',
        password: 'Test123',
      };

      await registerUser(userData);

      await expect(
        registerUser({
          email: 'different@example.com',
          username: 'authtest3',
          password: 'Test123',
        })
      ).rejects.toThrow('User with this email or username already exists');
    });

    it('should hash the password before storing', async () => {
      const userData = {
        email: 'authservice-test4@example.com',
        username: 'authtest4',
        password: 'PlainPassword123',
      };

      await registerUser(userData);

      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user?.password).not.toBe(userData.password);
      expect(user?.password.length).toBeGreaterThan(0);
    });
  });

  describe('loginUser', () => {
    const testEmail = 'authservice-test-login@example.com';
    const testPassword = 'LoginTest123';

    beforeAll(async () => {
      await registerUser({
        email: testEmail,
        username: 'logintest',
        password: testPassword,
      });
    });

    it('should login successfully with correct credentials', async () => {
      const result = await loginUser({
        email: testEmail,
        password: testPassword,
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(testEmail);
      expect(result.user).not.toHaveProperty('password');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        loginUser({
          email: 'nonexistent@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for incorrect password', async () => {
      await expect(
        loginUser({
          email: testEmail,
          password: 'WrongPassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should increment failed login attempts on wrong password', async () => {
      const testUser = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      const initialAttempts = testUser?.failedLoginAttempts || 0;

      try {
        await loginUser({
          email: testEmail,
          password: 'WrongPassword',
        });
      } catch (error) {
        // Expected to fail
      }

      const updatedUser = await prisma.user.findUnique({
        where: { email: testEmail },
      });

      expect(updatedUser?.failedLoginAttempts).toBe(initialAttempts + 1);
    });

    it('should block user after 3 failed login attempts', async () => {
      const blockedTestEmail = 'authservice-test-blocked@example.com';
      await registerUser({
        email: blockedTestEmail,
        username: 'blockedtest',
        password: 'Test123',
      });

      // Attempt 3 failed logins
      for (let i = 0; i < 3; i++) {
        try {
          await loginUser({
            email: blockedTestEmail,
            password: 'WrongPassword',
          });
        } catch (error) {
          // Expected to fail
        }
      }

      // Check user is blocked
      const user = await prisma.user.findUnique({
        where: { email: blockedTestEmail },
      });

      expect(user?.isBlocked).toBe(true);

      // Try to login with correct password (should still fail)
      await expect(
        loginUser({
          email: blockedTestEmail,
          password: 'Test123',
        })
      ).rejects.toThrow('Your account has been blocked');
    });

    it('should reset failed login attempts on successful login', async () => {
      const resetTestEmail = 'authservice-test-reset@example.com';
      const resetTestPassword = 'Reset123';

      await registerUser({
        email: resetTestEmail,
        username: 'resettest',
        password: resetTestPassword,
      });

      // One failed login
      try {
        await loginUser({
          email: resetTestEmail,
          password: 'WrongPassword',
        });
      } catch (error) {
        // Expected to fail
      }

      // Successful login
      await loginUser({
        email: resetTestEmail,
        password: resetTestPassword,
      });

      const user = await prisma.user.findUnique({
        where: { email: resetTestEmail },
      });

      expect(user?.failedLoginAttempts).toBe(0);
      expect(user?.lastFailedLogin).toBeNull();
    });

    it('should throw error for blocked user', async () => {
      const blockedEmail = 'authservice-test-blocked2@example.com';
      await registerUser({
        email: blockedEmail,
        username: 'blockedtest2',
        password: 'Test123',
      });

      // Manually block the user
      await prisma.user.update({
        where: { email: blockedEmail },
        data: { isBlocked: true },
      });

      await expect(
        loginUser({
          email: blockedEmail,
          password: 'Test123',
        })
      ).rejects.toThrow('Your account has been blocked');
    });
  });

  describe('getUserById', () => {
    let userId: string;

    beforeAll(async () => {
      const result = await registerUser({
        email: 'authservice-test-getuser@example.com',
        username: 'getusertest',
        password: 'Test123',
      });

      // Get the user ID from the database
      const user = await prisma.user.findUnique({
        where: { email: 'authservice-test-getuser@example.com' },
      });
      userId = user!.id;
    });

    it('should return user without password', async () => {
      const user = await getUserById(userId);

      expect(user).toBeDefined();
      expect(user?.email).toBe('authservice-test-getuser@example.com');
      expect(user).not.toHaveProperty('password');
    });

    it('should return null for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const user = await getUserById(fakeId);

      expect(user).toBeNull();
    });
  });
});
