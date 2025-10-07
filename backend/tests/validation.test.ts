import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();

describe('Input Validation Tests', () => {
  let adminToken: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Login as admin for tests that require authentication
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL || 'admin@movietracker.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
      });
    adminToken = adminLogin.body.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Registration Validation', () => {
    it('should reject email without @ symbol', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'notanemail.com',
          username: 'testuser',
          password: 'Password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should reject email without domain', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@',
          username: 'testuser',
          password: 'Password123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject username with only 1 character', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'a',
          password: 'Password123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject username with only 2 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'ab',
          password: 'Password123',
        });

      expect(response.status).toBe(400);
    });

    it('should accept username with exactly 3 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'val-test-3char@example.com',
          username: 'abc',
          password: 'Password123',
        });

      expect(response.status).toBe(201);
    });

    it('should reject password with only 7 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Pass123',
        });

      expect(response.status).toBe(400);
    });

    it('should accept password with exactly 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'val-test-8char@example.com',
          username: 'test8char',
          password: 'Pass1234',
        });

      expect(response.status).toBe(201);
    });

    it('should reject password with only letters (no numbers)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'PasswordOnly',
        });

      expect(response.status).toBe(400);
    });

    it('should reject password with only numbers (no letters)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: '123456789',
        });

      expect(response.status).toBe(400);
    });

    it('should accept password with mixed letters and numbers', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'val-test-mixed@example.com',
          username: 'testmixed',
          password: 'Pass1234',
        });

      expect(response.status).toBe(201);
    });

    it('should reject completely empty registration', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Login Validation', () => {
    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid.email',
          password: 'Password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should reject login with empty email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: 'Password123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject login with empty password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '',
        });

      expect(response.status).toBe(400);
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app).post('/api/auth/login').send({});

      expect(response.status).toBe(400);
    });
  });

  describe('Movie Validation', () => {
    it('should reject movie with empty title', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '',
          releaseYear: 2024,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should reject movie with missing title', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          releaseYear: 2024,
        });

      expect(response.status).toBe(400);
    });

    it('should reject movie with missing release year', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Movie',
        });

      expect(response.status).toBe(400);
    });

    it('should reject movie with year below minimum (1799)', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Very Old Movie',
          releaseYear: 1799,
        });

      expect(response.status).toBe(400);
    });

    it('should accept movie with year at minimum (1800)', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Val Test Old Movie',
          releaseYear: 1800,
        });

      expect(response.status).toBe(201);
    });

    it('should reject movie with year above maximum (2101)', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Far Future Movie',
          releaseYear: 2101,
        });

      expect(response.status).toBe(400);
    });

    it('should accept movie with year at maximum (2100)', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Val Test Future Movie',
          releaseYear: 2100,
        });

      expect(response.status).toBe(201);
    });

    it('should reject movie with non-numeric year', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Movie',
          releaseYear: 'not-a-year',
        });

      expect(response.status).toBe(400);
    });

    it('should reject movie with decimal year', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Movie',
          releaseYear: 2024.5,
        });

      expect(response.status).toBe(400);
    });

    it('should accept movie with valid optional fields', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Val Test Complete Movie',
          releaseYear: 2024,
          plot: 'A compelling story',
          posterUrl: 'https://example.com/poster.jpg',
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Special Characters and Edge Cases', () => {
    it('should handle email with special characters', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test+special@example.co.uk',
          username: 'specialuser',
          password: 'Password123',
        });

      expect(response.status).toBe(201);
    });

    it('should handle title with special characters', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: "Test Movie: The Beginning - Part 1 (Director's Cut)",
          releaseYear: 2024,
        });

      expect(response.status).toBe(201);
    });

    it('should handle title with unicode characters', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Movie 日本語 العربية',
          releaseYear: 2024,
        });

      expect(response.status).toBe(201);
    });

    it('should reject extremely long title (SQL injection attempt)', async () => {
      const longTitle = 'A'.repeat(10000);
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: longTitle,
          releaseYear: 2024,
        });

      // Should either accept or reject gracefully (not crash)
      expect([201, 400, 413]).toContain(response.status);
    });

    it('should handle null values gracefully', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: null,
          releaseYear: null,
        });

      expect(response.status).toBe(400);
    });

    it('should handle undefined values gracefully', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: undefined,
          releaseYear: undefined,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Content Type Validation', () => {
    it('should reject non-JSON content type', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'text/plain')
        .send('email=test@example.com&username=test&password=Password123');

      // Depending on implementation, might be 400 or 415
      expect([400, 415]).toContain(response.status);
    });

    it('should accept application/json content type', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            email: 'val-test-json@example.com',
            username: 'jsonuser',
            password: 'Password123',
          })
        );

      expect(response.status).toBe(201);
    });
  });

  describe('Multiple Validation Errors', () => {
    it('should return all validation errors at once', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'ab',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
      expect(response.body.details.length).toBeGreaterThan(1);
    });

    it('should return all movie validation errors', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '',
          releaseYear: 1700,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('details');
      expect(Array.isArray(response.body.details)).toBe(true);
    });
  });
});
