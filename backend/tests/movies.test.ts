import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/app';

const prisma = new PrismaClient();

describe('Movie Tests', () => {
  let adminToken: string;
  let userToken: string;
  let movieId: string;

  beforeAll(async () => {
    await prisma.$connect();

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: process.env.ADMIN_EMAIL || 'admin@movietracker.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
      });
    adminToken = adminLogin.body.token;

    // Create a regular user
    const userRegister = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'movietest@example.com',
        username: 'movieuser',
        password: 'Test123',
      });
    userToken = userRegister.body.token;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.movie.deleteMany({
      where: {
        title: {
          contains: 'Test Movie',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: 'movietest@example.com',
      },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/movies', () => {
    it('should create a movie as admin', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Movie 1',
          releaseYear: 2024,
          plot: 'A test movie plot',
          posterUrl: 'https://example.com/poster.jpg',
        });

      expect(response.status).toBe(201);
      expect(response.body.movie).toHaveProperty('title', 'Test Movie 1');
      movieId = response.body.movie.id;
    });

    it('should fail to create movie as regular user', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Movie 2',
          releaseYear: 2024,
        });

      expect(response.status).toBe(403);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/movies')
        .send({
          title: 'Test Movie 3',
          releaseYear: 2024,
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/movies', () => {
    it('should get all movies', async () => {
      const response = await request(app).get('/api/movies');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('movies');
      expect(Array.isArray(response.body.movies)).toBe(true);
    });

    it('should filter movies by title', async () => {
      const response = await request(app)
        .get('/api/movies')
        .query({ title: 'Test Movie' });

      expect(response.status).toBe(200);
      expect(response.body.movies.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/movies/:id', () => {
    it('should get movie by id', async () => {
      const response = await request(app).get(`/api/movies/${movieId}`);

      expect(response.status).toBe(200);
      expect(response.body.movie).toHaveProperty('id', movieId);
    });

    it('should return 404 for non-existent movie', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app).get(`/api/movies/${fakeId}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/movies/:id', () => {
    it('should update movie as admin', async () => {
      const response = await request(app)
        .put(`/api/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Test Movie',
        });

      expect(response.status).toBe(200);
      expect(response.body.movie).toHaveProperty('title', 'Updated Test Movie');
    });

    it('should fail to update as regular user', async () => {
      const response = await request(app)
        .put(`/api/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Should Fail',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/movies/:id', () => {
    it('should fail to delete as regular user', async () => {
      const response = await request(app)
        .delete(`/api/movies/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should delete movie as admin', async () => {
      const response = await request(app)
        .delete(`/api/movies/${movieId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });
});
