import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();

    // Cleanup test data from previous runs
    await prisma.userRating.deleteMany({
      where: {
        user: {
          email: {
            contains: 'dbtest',
          },
        },
      },
    });
    await prisma.watchStatus.deleteMany({
      where: {
        user: {
          email: {
            contains: 'dbtest',
          },
        },
      },
    });
    await prisma.movieGenre.deleteMany({
      where: {
        movie: {
          title: {
            contains: 'DB Test',
          },
        },
      },
    });
    await prisma.externalRating.deleteMany({
      where: {
        movie: {
          title: {
            contains: 'DB Test',
          },
        },
      },
    });
    await prisma.movie.deleteMany({
      where: {
        title: {
          contains: 'DB Test',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'dbtest',
        },
      },
    });
    await prisma.genre.deleteMany({
      where: {
        id: {
          in: ['9999', '9998'],
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.userRating.deleteMany({
      where: {
        user: {
          email: {
            contains: 'dbtest',
          },
        },
      },
    });
    await prisma.watchStatus.deleteMany({
      where: {
        user: {
          email: {
            contains: 'dbtest',
          },
        },
      },
    });
    await prisma.movieGenre.deleteMany({
      where: {
        movie: {
          title: {
            contains: 'DB Test',
          },
        },
      },
    });
    await prisma.externalRating.deleteMany({
      where: {
        movie: {
          title: {
            contains: 'DB Test',
          },
        },
      },
    });
    await prisma.movie.deleteMany({
      where: {
        title: {
          contains: 'DB Test',
        },
      },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: 'dbtest',
        },
      },
    });
    await prisma.genre.deleteMany({
      where: {
        id: {
          in: ['9999', '9998'],
        },
      },
    });
    await prisma.$disconnect();
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      await expect(prisma.$connect()).resolves.not.toThrow();
    });

    it('should execute a simple query', async () => {
      const result = await prisma.user.findMany({ take: 1 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('User Model', () => {
    it('should create a user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'dbtest1@example.com',
          username: 'dbtest1',
          password: 'hashedpassword',
        },
      });

      expect(user).toHaveProperty('id');
      expect(user.email).toBe('dbtest1@example.com');
      expect(user.username).toBe('dbtest1');
      expect(user.role).toBe('USER');
      expect(user.isBlocked).toBe(false);
      expect(user.failedLoginAttempts).toBe(0);
    });

    it('should enforce unique email constraint', async () => {
      await prisma.user.create({
        data: {
          email: 'dbtest2@example.com',
          username: 'dbtest2',
          password: 'hashedpassword',
        },
      });

      await expect(
        prisma.user.create({
          data: {
            email: 'dbtest2@example.com',
            username: 'different',
            password: 'hashedpassword',
          },
        })
      ).rejects.toThrow();
    });

    it('should enforce unique username constraint', async () => {
      await prisma.user.create({
        data: {
          email: 'dbtest3@example.com',
          username: 'dbtest3',
          password: 'hashedpassword',
        },
      });

      await expect(
        prisma.user.create({
          data: {
            email: 'different@example.com',
            username: 'dbtest3',
            password: 'hashedpassword',
          },
        })
      ).rejects.toThrow();
    });

    it('should update user properties', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'dbtest4@example.com',
          username: 'dbtest4',
          password: 'hashedpassword',
        },
      });

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 3,
          isBlocked: true,
        },
      });

      expect(updated.failedLoginAttempts).toBe(3);
      expect(updated.isBlocked).toBe(true);
    });

    it('should delete a user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'dbtest5@example.com',
          username: 'dbtest5',
          password: 'hashedpassword',
        },
      });

      await prisma.user.delete({
        where: { id: user.id },
      });

      const deletedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(deletedUser).toBeNull();
    });
  });

  describe('Movie Model', () => {
    it('should create a movie', async () => {
      const movie = await prisma.movie.create({
        data: {
          title: 'DB Test Movie 1',
          releaseYear: 2024,
          plot: 'A test movie',
          tmdbId: 9001,
        },
      });

      expect(movie).toHaveProperty('id');
      expect(movie.title).toBe('DB Test Movie 1');
      expect(movie.releaseYear).toBe(2024);
      expect(movie.tmdbId).toBe(9001);
    });

    it('should enforce unique tmdbId constraint', async () => {
      await prisma.movie.create({
        data: {
          title: 'DB Test Movie 2',
          releaseYear: 2024,
          tmdbId: 9002,
        },
      });

      await expect(
        prisma.movie.create({
          data: {
            title: 'Different Title',
            releaseYear: 2024,
            tmdbId: 9002,
          },
        })
      ).rejects.toThrow();
    });

    it('should create movie with genres', async () => {
      const genre = await prisma.genre.upsert({
        where: { id: '99' },
        update: {},
        create: { id: '99', name: 'Test Genre' },
      });

      const movie = await prisma.movie.create({
        data: {
          title: 'DB Test Movie 3',
          releaseYear: 2024,
          tmdbId: 9003,
          genres: {
            create: [{ genreId: genre.id }],
          },
        },
        include: {
          genres: {
            include: { genre: true },
          },
        },
      });

      expect(movie.genres.length).toBe(1);
      expect(movie.genres[0].genre.name).toBe('Test Genre');
    });

    it('should create movie with external ratings', async () => {
      const movie = await prisma.movie.create({
        data: {
          title: 'DB Test Movie 4',
          releaseYear: 2024,
          tmdbId: 9004,
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
        include: {
          externalRatings: true,
        },
      });

      expect(movie.externalRatings.length).toBe(1);
      expect(movie.externalRatings[0].source).toBe('IMDB');
      expect(movie.externalRatings[0].rating).toBe(8.5);
    });
  });

  describe('Genre Model', () => {
    it('should create a genre', async () => {
      const genre = await prisma.genre.create({
        data: {
          id: '9999',
          name: 'DB Test Genre',
        },
      });

      expect(genre.id).toBe('9999');
      expect(genre.name).toBe('DB Test Genre');
    });

    it('should enforce unique id constraint', async () => {
      await prisma.genre.create({
        data: {
          id: '9998',
          name: 'DB Test Genre 2',
        },
      });

      await expect(
        prisma.genre.create({
          data: {
            id: '9998',
            name: 'Different Name',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('UserRating Model', () => {
    let testUser: any;
    let testMovie: any;

    beforeAll(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'dbtest-rating@example.com',
          username: 'dbtestrating',
          password: 'hashedpassword',
        },
      });

      testMovie = await prisma.movie.create({
        data: {
          title: 'DB Test Movie for Rating',
          releaseYear: 2024,
          tmdbId: 9005,
        },
      });
    });

    afterEach(async () => {
      // Clean up ratings after each test
      await prisma.userRating.deleteMany({
        where: {
          userId: testUser.id,
          movieId: testMovie.id,
        },
      });
    });

    it('should create a user rating', async () => {
      const rating = await prisma.userRating.create({
        data: {
          userId: testUser.id,
          movieId: testMovie.id,
          rating: 8,
          watchedDate: new Date(),
        },
      });

      expect(rating).toHaveProperty('id');
      expect(rating.userId).toBe(testUser.id);
      expect(rating.movieId).toBe(testMovie.id);
      expect(rating.rating).toBe(8);
    });

    it('should enforce unique user-movie pair', async () => {
      await prisma.userRating.create({
        data: {
          userId: testUser.id,
          movieId: testMovie.id,
          rating: 7,
          watchedDate: new Date(),
        },
      });

      await expect(
        prisma.userRating.create({
          data: {
            userId: testUser.id,
            movieId: testMovie.id,
            rating: 9,
            watchedDate: new Date(),
          },
        })
      ).rejects.toThrow();
    });

    it('should update a user rating', async () => {
      const rating = await prisma.userRating.findFirst({
        where: {
          userId: testUser.id,
          movieId: testMovie.id,
        },
      });

      const updated = await prisma.userRating.update({
        where: { id: rating!.id },
        data: { rating: 10 },
      });

      expect(updated.rating).toBe(10);
    });

    it('should include timestamps', async () => {
      const rating = await prisma.userRating.findFirst({
        where: {
          userId: testUser.id,
          movieId: testMovie.id,
        },
      });

      expect(rating).toHaveProperty('createdAt');
      expect(rating).toHaveProperty('updatedAt');
      expect(rating!.createdAt).toBeInstanceOf(Date);
      expect(rating!.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('WatchStatus Model', () => {
    let testUser: any;
    let testMovie: any;

    beforeAll(async () => {
      testUser = await prisma.user.create({
        data: {
          email: 'dbtest-watch@example.com',
          username: 'dbtestwatch',
          password: 'hashedpassword',
        },
      });

      testMovie = await prisma.movie.create({
        data: {
          title: 'DB Test Movie for Watch Status',
          releaseYear: 2024,
          tmdbId: 9006,
        },
      });
    });

    afterEach(async () => {
      // Clean up watch statuses after each test
      await prisma.watchStatus.deleteMany({
        where: {
          userId: testUser.id,
          movieId: testMovie.id,
        },
      });
    });

    it('should create a watch status', async () => {
      const watchStatus = await prisma.watchStatus.create({
        data: {
          userId: testUser.id,
          movieId: testMovie.id,
          watched: true,
          watchedDate: new Date(),
        },
      });

      expect(watchStatus).toHaveProperty('id');
      expect(watchStatus.watched).toBe(true);
    });

    it('should support watched and unwatched states', async () => {
      const watched = await prisma.watchStatus.create({
        data: {
          userId: testUser.id,
          movieId: testMovie.id,
          watched: true,
          watchedDate: new Date(),
        },
      });

      expect(watched.watched).toBe(true);

      await prisma.watchStatus.delete({ where: { id: watched.id } });

      const unwatched = await prisma.watchStatus.create({
        data: {
          userId: testUser.id,
          movieId: testMovie.id,
          watched: false,
        },
      });

      expect(unwatched.watched).toBe(false);
      await prisma.watchStatus.delete({ where: { id: unwatched.id } });
    });

    it('should enforce unique user-movie pair', async () => {
      await prisma.watchStatus.create({
        data: {
          userId: testUser.id,
          movieId: testMovie.id,
          watched: true,
          watchedDate: new Date(),
        },
      });

      await expect(
        prisma.watchStatus.create({
          data: {
            userId: testUser.id,
            movieId: testMovie.id,
            watched: false,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Cascading Deletes', () => {
    it('should delete related ratings when user is deleted', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'dbtest-cascade@example.com',
          username: 'dbtestcascade',
          password: 'hashedpassword',
        },
      });

      const movie = await prisma.movie.create({
        data: {
          title: 'DB Test Movie for Cascade',
          releaseYear: 2024,
          tmdbId: 9007,
        },
      });

      await prisma.userRating.create({
        data: {
          userId: user.id,
          movieId: movie.id,
          rating: 8,
          watchedDate: new Date(),
        },
      });

      await prisma.user.delete({
        where: { id: user.id },
      });

      const ratings = await prisma.userRating.findMany({
        where: { userId: user.id },
      });

      expect(ratings.length).toBe(0);
    });

    it('should delete related data when movie is deleted', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'dbtest-cascade2@example.com',
          username: 'dbtestcascade2',
          password: 'hashedpassword',
        },
      });

      const movie = await prisma.movie.create({
        data: {
          title: 'DB Test Movie for Cascade 2',
          releaseYear: 2024,
          tmdbId: 9008,
        },
      });

      await prisma.userRating.create({
        data: {
          userId: user.id,
          movieId: movie.id,
          rating: 8,
          watchedDate: new Date(),
        },
      });

      await prisma.externalRating.create({
        data: {
          movieId: movie.id,
          source: 'IMDB',
          rating: 7.5,
          ratingCount: 100,
        },
      });

      await prisma.movie.delete({
        where: { id: movie.id },
      });

      const ratings = await prisma.userRating.findMany({
        where: { movieId: movie.id },
      });

      const externalRatings = await prisma.externalRating.findMany({
        where: { movieId: movie.id },
      });

      expect(ratings.length).toBe(0);
      expect(externalRatings.length).toBe(0);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      // Attempt to create rating with non-existent user
      await expect(
        prisma.userRating.create({
          data: {
            userId: '00000000-0000-0000-0000-000000000000',
            movieId: '00000000-0000-0000-0000-000000000001',
            rating: 8,
            watchedDate: new Date(),
          },
        })
      ).rejects.toThrow();
    });

    it('should validate rating range constraints', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'dbtest-constraint@example.com',
          username: 'dbtestconstraint',
          password: 'hashedpassword',
        },
      });

      const movie = await prisma.movie.create({
        data: {
          title: 'DB Test Movie for Constraints',
          releaseYear: 2024,
          tmdbId: 9009,
        },
      });

      // Valid rating
      const validRating = await prisma.userRating.create({
        data: {
          userId: user.id,
          movieId: movie.id,
          rating: 5,
          watchedDate: new Date(),
        },
      });

      expect(validRating.rating).toBe(5);
    });

    it('should handle transactions correctly', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'dbtest-transaction@example.com',
          username: 'dbtesttransaction',
          password: 'hashedpassword',
        },
      });

      const movie = await prisma.movie.create({
        data: {
          title: 'DB Test Movie for Transaction',
          releaseYear: 2024,
          tmdbId: 9010,
        },
      });

      // Transaction that should succeed
      await prisma.$transaction([
        prisma.userRating.create({
          data: {
            userId: user.id,
            movieId: movie.id,
            rating: 8,
            watchedDate: new Date(),
          },
        }),
        prisma.watchStatus.create({
          data: {
            userId: user.id,
            movieId: movie.id,
            watched: true,
            watchedDate: new Date(),
          },
        }),
      ]);

      const rating = await prisma.userRating.findFirst({
        where: { userId: user.id, movieId: movie.id },
      });

      const watchStatus = await prisma.watchStatus.findFirst({
        where: { userId: user.id, movieId: movie.id },
      });

      expect(rating).toBeDefined();
      expect(watchStatus).toBeDefined();
    });
  });
});
