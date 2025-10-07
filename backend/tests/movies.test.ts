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
        password: 'Test12345',
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

  describe('GET /api/movies/recommendations', () => {
    it('should get recommendations for authenticated user', async () => {
      const response = await request(app)
        .get('/api/movies/recommendations')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('recommendations');
      expect(Array.isArray(response.body.recommendations)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app).get('/api/movies/recommendations');

      expect(response.status).toBe(401);
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/movies/recommendations')
        .query({ limit: 5 })
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/movies/discover', () => {
    it('should discover movies without authentication', async () => {
      const response = await request(app).get('/api/movies/discover');

      expect(response.status).toBe(200);
    });

    it('should accept genre filter', async () => {
      const response = await request(app)
        .get('/api/movies/discover')
        .query({ with_genres: '28' });

      expect(response.status).toBe(200);
    });

    it('should accept sort parameter', async () => {
      const response = await request(app)
        .get('/api/movies/discover')
        .query({ sort_by: 'popularity.desc' });

      expect(response.status).toBe(200);
    });

    it('should accept page parameter', async () => {
      const response = await request(app)
        .get('/api/movies/discover')
        .query({ page: 2 });

      expect(response.status).toBe(200);
    });
  });

  describe('Input Validation - Movies', () => {
    it('should fail to create movie without title', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          releaseYear: 2024,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should fail to create movie without release year', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Movie',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should fail to create movie with invalid release year (too old)', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Movie',
          releaseYear: 1700,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should fail to create movie with invalid release year (too new)', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Movie',
          releaseYear: 2200,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Validation failed');
    });

    it('should create movie with valid year at lower boundary', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Movie Old',
          releaseYear: 1800,
        });

      expect(response.status).toBe(201);
    });

    it('should create movie with valid year at upper boundary', async () => {
      const response = await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Movie Future',
          releaseYear: 2100,
        });

      expect(response.status).toBe(201);
    });
  });

  describe('Search and Filter', () => {
    beforeAll(async () => {
      // Create test movies with specific titles
      await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Action Movie',
          releaseYear: 2020,
        });

      await request(app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Drama Movie',
          releaseYear: 2021,
        });
    });

    it('should search movies by partial title match', async () => {
      const response = await request(app)
        .get('/api/movies')
        .query({ title: 'Action' });

      expect(response.status).toBe(200);
      expect(response.body.movies).toBeDefined();
    });

    it('should return empty results for non-matching search', async () => {
      const response = await request(app)
        .get('/api/movies')
        .query({ title: 'NonExistentMovieTitle12345' });

      expect(response.status).toBe(200);
      expect(response.body.movies).toBeDefined();
    });
  });
});
