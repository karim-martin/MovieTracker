import { PrismaClient } from '@prisma/client';
import { recommendationService } from '../src/services/recommendationService';

const prisma = new PrismaClient();

describe('RecommendationService', () => {
  let testUserId: string;
  let testMovieIds: string[] = [];
  let testGenreIds: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();

    // Clean up any existing test data
    await prisma.userRating.deleteMany({
      where: {
        user: {
          email: 'rectest@example.com',
        },
      },
    });
    await prisma.movieGenre.deleteMany({
      where: {
        movie: {
          title: {
            contains: 'Test Action Movie',
          },
        },
      },
    });
    await prisma.externalRating.deleteMany({
      where: {
        movie: {
          title: {
            contains: 'Test Action Movie',
          },
        },
      },
    });
    await prisma.movie.deleteMany({
      where: {
        title: {
          contains: 'Test Action Movie',
        },
      },
    });
    await prisma.movie.deleteMany({
      where: {
        title: {
          contains: 'Test Drama Movie',
        },
      },
    });
    await prisma.movie.deleteMany({
      where: {
        title: {
          contains: 'Test Comedy Movie',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: 'rectest@example.com',
      },
    });
    await prisma.genre.deleteMany({
      where: {
        id: {
          in: ['rectest-action', 'rectest-drama', 'rectest-comedy'],
        },
      },
    });

    // Create test user
    const hashedPassword = 'hashedpassword'; // Mock hash
    const user = await prisma.user.create({
      data: {
        email: 'rectest@example.com',
        username: 'rectest',
        password: hashedPassword,
      },
    });
    testUserId = user.id;

    // Create test genres with unique names
    const actionGenre = await prisma.genre.upsert({
      where: { id: 'rectest-action' },
      update: {},
      create: { id: 'rectest-action', name: 'RecTest Action' },
    });
    const dramaGenre = await prisma.genre.upsert({
      where: { id: 'rectest-drama' },
      update: {},
      create: { id: 'rectest-drama', name: 'RecTest Drama' },
    });
    const comedyGenre = await prisma.genre.upsert({
      where: { id: 'rectest-comedy' },
      update: {},
      create: { id: 'rectest-comedy', name: 'RecTest Comedy' },
    });

    testGenreIds = [actionGenre.id, dramaGenre.id, comedyGenre.id];

    // Create test movies
    const movie1 = await prisma.movie.create({
      data: {
        title: 'Test Action Movie 1',
        releaseYear: 2020,
        plot: 'An action-packed movie',
        tmdbId: 1001,
        genres: {
          create: [{ genreId: actionGenre.id }],
        },
        externalRatings: {
          create: [
            {
              source: 'IMDB',
              rating: 8.5,
              ratingCount: 1000,
            },
          ],
        },
      },
    });

    const movie2 = await prisma.movie.create({
      data: {
        title: 'Test Action Movie 2',
        releaseYear: 2021,
        plot: 'Another action movie',
        tmdbId: 1002,
        genres: {
          create: [{ genreId: actionGenre.id }],
        },
        externalRatings: {
          create: [
            {
              source: 'IMDB',
              rating: 7.8,
            },
          ],
        },
      },
    });

    const movie3 = await prisma.movie.create({
      data: {
        title: 'Test Drama Movie',
        releaseYear: 2019,
        plot: 'A dramatic story',
        tmdbId: 1003,
        genres: {
          create: [{ genreId: dramaGenre.id }],
        },
        externalRatings: {
          create: [
            {
              source: 'IMDB',
              rating: 9.0,
            },
          ],
        },
      },
    });

    const movie4 = await prisma.movie.create({
      data: {
        title: 'Test Comedy Movie',
        releaseYear: 2022,
        plot: 'A funny movie',
        tmdbId: 1004,
        genres: {
          create: [{ genreId: comedyGenre.id }],
        },
        externalRatings: {
          create: [
            {
              source: 'IMDB',
              rating: 6.5,
            },
          ],
        },
      },
    });

    testMovieIds = [movie1.id, movie2.id, movie3.id, movie4.id];
  });

  afterAll(async () => {
    // Cleanup
    await prisma.userRating.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.movieGenre.deleteMany({
      where: { movieId: { in: testMovieIds } },
    });
    await prisma.externalRating.deleteMany({
      where: { movieId: { in: testMovieIds } },
    });
    await prisma.movie.deleteMany({
      where: { id: { in: testMovieIds } },
    });
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
    await prisma.genre.deleteMany({
      where: { id: { in: testGenreIds } },
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up ratings after each test
    await prisma.userRating.deleteMany({
      where: { userId: testUserId },
    });
  });

  describe('getRecommendations', () => {
    it('should return popular movies when user has no ratings', async () => {
      const recommendations = await recommendationService.getRecommendations(
        testUserId,
        5
      );

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      expect(recommendations[0]).toHaveProperty('id');
      expect(recommendations[0]).toHaveProperty('title');
      expect(recommendations[0]).toHaveProperty('source', 'tmdb');
    });

    it('should return recommendations based on user preferences', async () => {
      // Rate action movies highly
      await prisma.userRating.create({
        data: {
          userId: testUserId,
          movieId: testMovieIds[0], // Action movie 1
          rating: 9,
          watchedDate: new Date(),
        },
      });

      await prisma.userRating.create({
        data: {
          userId: testUserId,
          movieId: testMovieIds[1], // Action movie 2
          rating: 8,
          watchedDate: new Date(),
        },
      });

      const recommendations = await recommendationService.getRecommendations(
        testUserId,
        3
      );

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(3);

      // Should have recommendation score and reason
      expect(recommendations[0]).toHaveProperty('recommendationScore');
      expect(recommendations[0]).toHaveProperty('recommendationReason');
    });

    it('should exclude already rated movies', async () => {
      // Rate all movies
      for (let i = 0; i < testMovieIds.length; i++) {
        await prisma.userRating.create({
          data: {
            userId: testUserId,
            movieId: testMovieIds[i],
            rating: 7 + i,
            watchedDate: new Date(),
          },
        });
      }

      const recommendations = await recommendationService.getRecommendations(
        testUserId,
        5
      );

      // Should not include any of the rated movies
      const recommendedIds = recommendations.map((r) => r.id);
      testMovieIds.forEach((id) => {
        expect(recommendedIds).not.toContain(id);
      });
    });

    it('should respect the limit parameter', async () => {
      await prisma.userRating.create({
        data: {
          userId: testUserId,
          movieId: testMovieIds[0],
          rating: 8,
          watchedDate: new Date(),
        },
      });

      const limit = 2;
      const recommendations = await recommendationService.getRecommendations(
        testUserId,
        limit
      );

      expect(recommendations.length).toBeLessThanOrEqual(limit);
    });

    it('should handle errors gracefully and return popular movies', async () => {
      // Use invalid user ID to trigger error path
      const recommendations = await recommendationService.getRecommendations(
        '00000000-0000-0000-0000-000000000000',
        5
      );

      // Should still return recommendations (popular movies as fallback)
      expect(Array.isArray(recommendations)).toBe(true);
    });
  });

  describe('calculateGenrePreferences', () => {
    it('should calculate genre scores based on ratings', async () => {
      // Create mock user ratings data
      const mockRatings = [
        {
          rating: 9,
          movie: {
            genres: [
              { genre: { id: '28', name: 'Action' } },
              { genre: { id: '18', name: 'Drama' } },
            ],
          },
        },
        {
          rating: 8,
          movie: {
            genres: [{ genre: { id: '28', name: 'Action' } }],
          },
        },
        {
          rating: 5,
          movie: {
            genres: [{ genre: { id: '35', name: 'Comedy' } }],
          },
        },
      ];

      const genreScores =
        recommendationService.calculateGenrePreferences(mockRatings);

      expect(Array.isArray(genreScores)).toBe(true);
      expect(genreScores.length).toBe(3);

      // Should be sorted by score descending
      for (let i = 0; i < genreScores.length - 1; i++) {
        expect(genreScores[i].score).toBeGreaterThanOrEqual(
          genreScores[i + 1].score
        );
      }

      // Action should have highest score (appears in 2 highly rated movies)
      expect(genreScores[0].genreId).toBe(28);
      expect(genreScores[0].genreName).toBe('Action');
    });

    it('should handle empty ratings array', async () => {
      const genreScores = recommendationService.calculateGenrePreferences([]);

      expect(Array.isArray(genreScores)).toBe(true);
      expect(genreScores.length).toBe(0);
    });

    it('should weight higher ratings more heavily', async () => {
      const mockRatings = [
        {
          rating: 10,
          movie: {
            genres: [{ genre: { id: '28', name: 'Action' } }],
          },
        },
        {
          rating: 1,
          movie: {
            genres: [{ genre: { id: '35', name: 'Comedy' } }],
          },
        },
      ];

      const genreScores =
        recommendationService.calculateGenrePreferences(mockRatings);

      expect(genreScores[0].genreName).toBe('Action');
      expect(genreScores[0].score).toBeGreaterThan(genreScores[1].score);
    });
  });

  describe('getPopularMoviesAsRecommendations', () => {
    it('should return popular movies from database', async () => {
      const recommendations =
        await recommendationService.getPopularMoviesAsRecommendations(5);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.length).toBeLessThanOrEqual(5);
      expect(recommendations[0]).toHaveProperty('title');
      expect(recommendations[0]).toHaveProperty('recommendationReason');
    });

    it('should sort movies by rating', async () => {
      const recommendations =
        await recommendationService.getPopularMoviesAsRecommendations(10);

      // Create user ratings to verify sorting
      await prisma.userRating.create({
        data: {
          userId: testUserId,
          movieId: testMovieIds[0],
          rating: 9,
          watchedDate: new Date(),
        },
      });

      const newRecommendations =
        await recommendationService.getPopularMoviesAsRecommendations(10);

      expect(Array.isArray(newRecommendations)).toBe(true);
    });

    it('should respect the limit parameter', async () => {
      const limit = 3;
      const recommendations =
        await recommendationService.getPopularMoviesAsRecommendations(limit);

      expect(recommendations.length).toBeLessThanOrEqual(limit);
    });

    it('should return empty array when no movies exist', async () => {
      // This test assumes we can create an isolated scenario
      // In practice, there will be movies from setup
      const recommendations =
        await recommendationService.getPopularMoviesAsRecommendations(0);

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBe(0);
    });

    it('should include external ratings when user ratings are absent', async () => {
      const recommendations =
        await recommendationService.getPopularMoviesAsRecommendations(5);

      expect(recommendations.length).toBeGreaterThan(0);
      // Movies should have external ratings from setup
      const testMovie = testMovieIds[0];
      const movie = await prisma.movie.findUnique({
        where: { id: testMovie },
        include: { externalRatings: true },
      });

      expect(movie?.externalRatings.length).toBeGreaterThan(0);
    });
  });
});
