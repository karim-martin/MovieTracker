import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/auth';
import { tmdbService } from '../services/tmdbService';
import logger from '../config/logger';

const prisma = new PrismaClient();

// Search/discover TMDB movies for import
export const searchTMDBMovies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { query, page = '1' } = req.query;
    const pageNum = parseInt(page as string);

    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    const tmdbResults = await tmdbService.searchMovies(query as string, pageNum);

    const movies = tmdbResults.results.map((movie) => ({
      tmdbId: movie.id,
      title: movie.title,
      releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      plot: movie.overview,
      posterUrl: tmdbService.getPosterUrl(movie.poster_path),
      backdropUrl: tmdbService.getBackdropUrl(movie.backdrop_path),
      rating: movie.vote_average,
      voteCount: movie.vote_count,
    }));

    res.status(200).json({
      movies,
      pagination: {
        total: tmdbResults.total_results,
        page: pageNum,
        totalPages: tmdbResults.total_pages,
      },
    });
  } catch (error) {
    logger.error('Search TMDB error:', error);
    res.status(500).json({ error: 'Failed to search TMDB' });
  }
};

// Get movies released in 2025 using discover endpoint
export const getPopularTMDBMovies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1' } = req.query;
    const pageNum = parseInt(page as string);

    const tmdbResults = await tmdbService.discoverMovies({
      page: pageNum,
      primary_release_year: 2025,
      sort_by: 'popularity.desc'
    });

    const movies = tmdbResults.results.map((movie) => ({
      tmdbId: movie.id,
      title: movie.title,
      releaseYear: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      plot: movie.overview,
      posterUrl: tmdbService.getPosterUrl(movie.poster_path),
      backdropUrl: tmdbService.getBackdropUrl(movie.backdrop_path),
      rating: movie.vote_average,
      voteCount: movie.vote_count,
    }));

    res.status(200).json({
      movies,
      pagination: {
        total: tmdbResults.total_results,
        page: pageNum,
        totalPages: tmdbResults.total_pages,
      },
    });
  } catch (error) {
    logger.error('Get 2025 movies error:', error);
    res.status(500).json({ error: 'Failed to get 2025 movies' });
  }
};

// Get detailed movie info from TMDB
export const getTMDBMovieDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tmdbId } = req.params;

    const movieDetails = await tmdbService.getMovieDetails(parseInt(tmdbId));

    const movie = {
      tmdbId: movieDetails.id,
      title: movieDetails.title,
      releaseYear: movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : null,
      plot: movieDetails.overview,
      posterUrl: tmdbService.getPosterUrl(movieDetails.poster_path),
      backdropUrl: tmdbService.getBackdropUrl(movieDetails.backdrop_path),
      genres: movieDetails.genres.map((g: any) => g.name),
      directors: movieDetails.credits?.crew.filter((c: any) => c.job === 'Director').map((c: any) => c.name) || [],
      producers: movieDetails.credits?.crew.filter((c: any) => c.job === 'Producer').map((c: any) => c.name) || [],
      cast: movieDetails.credits?.cast.slice(0, 10).map((c: any) => ({
        name: c.name,
        character: c.character,
      })) || [],
      externalRatings: [
        {
          source: 'TMDB',
          rating: movieDetails.vote_average,
          ratingCount: movieDetails.vote_count,
        },
      ],
    };

    res.status(200).json({ movie });
  } catch (error) {
    logger.error('Get TMDB movie details error:', error);
    res.status(500).json({ error: 'Failed to get movie details' });
  }
};

// Import a movie from TMDB to local database
export const importTMDBMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tmdbId } = req.body;

    if (!tmdbId) {
      res.status(400).json({ error: 'TMDB ID is required' });
      return;
    }

    // Check if movie already exists
    const existingMovie = await prisma.movie.findFirst({
      where: { tmdbId: parseInt(tmdbId) },
    });

    if (existingMovie) {
      res.status(409).json({ error: 'Movie already exists in database' });
      return;
    }

    // Fetch movie details from TMDB
    const movieDetails = await tmdbService.getMovieDetails(parseInt(tmdbId));

    // Create movie
    const movie = await prisma.movie.create({
      data: {
        title: movieDetails.title,
        releaseYear: movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : 1900,
        plot: movieDetails.overview,
        posterUrl: tmdbService.getPosterUrl(movieDetails.poster_path),
        tmdbId: movieDetails.id,
      },
    });

    // Import genres
    for (const tmdbGenre of movieDetails.genres) {
      let genre = await prisma.genre.findFirst({
        where: { name: tmdbGenre.name },
      });

      if (!genre) {
        genre = await prisma.genre.create({
          data: { name: tmdbGenre.name },
        });
      }

      await prisma.movieGenre.create({
        data: {
          movieId: movie.id,
          genreId: genre.id,
        },
      });
    }

    // Import directors
    const directors = movieDetails.credits?.crew.filter((c: any) => c.job === 'Director') || [];
    for (const director of directors) {
      let person = await prisma.person.findFirst({
        where: { name: director.name, type: 'DIRECTOR' },
      });

      if (!person) {
        person = await prisma.person.create({
          data: { name: director.name, type: 'DIRECTOR' },
        });
      }

      await prisma.movieCredit.create({
        data: {
          movieId: movie.id,
          personId: person.id,
          role: 'director',
        },
      });
    }

    // Import producers
    const producers = movieDetails.credits?.crew.filter((c: any) => c.job === 'Producer').slice(0, 5) || [];
    for (const producer of producers) {
      let person = await prisma.person.findFirst({
        where: { name: producer.name, type: 'PRODUCER' },
      });

      if (!person) {
        person = await prisma.person.create({
          data: { name: producer.name, type: 'PRODUCER' },
        });
      }

      await prisma.movieCredit.create({
        data: {
          movieId: movie.id,
          personId: person.id,
          role: 'producer',
        },
      });
    }

    // Import cast (top 10)
    const cast = movieDetails.credits?.cast.slice(0, 10) || [];
    for (const actor of cast) {
      let person = await prisma.person.findFirst({
        where: { name: actor.name, type: 'ACTOR' },
      });

      if (!person) {
        person = await prisma.person.create({
          data: { name: actor.name, type: 'ACTOR' },
        });
      }

      await prisma.movieCredit.create({
        data: {
          movieId: movie.id,
          personId: person.id,
          role: 'actor',
          characterName: actor.character,
        },
      });
    }

    // Import TMDB rating
    await prisma.externalRating.create({
      data: {
        movieId: movie.id,
        source: 'IMDB', // TMDB uses IMDB data
        rating: movieDetails.vote_average,
        ratingCount: movieDetails.vote_count,
      },
    });

    // Fetch full movie with relations
    const fullMovie = await prisma.movie.findUnique({
      where: { id: movie.id },
      include: {
        genres: { include: { genre: true } },
        credits: { include: { person: true } },
        externalRatings: true,
      },
    });

    res.status(201).json({
      message: 'Movie imported successfully',
      movie: fullMovie,
    });
  } catch (error) {
    logger.error('Import TMDB movie error:', error);
    res.status(500).json({ error: 'Failed to import movie' });
  }
};

// Bulk import movies released in 2025
export const bulkImportPopular = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const imported = [];
    const skipped = [];

    // Fetch all pages (TMDB returns 20 results per page, typically 500+ total pages for a year)
    // Let's fetch first 5 pages (100 movies) to avoid timeout
    const maxPages = 5;

    for (let page = 1; page <= maxPages; page++) {
      const tmdbResults = await tmdbService.discoverMovies({
        page,
        primary_release_year: 2025,
        sort_by: 'popularity.desc'
      });

      if (!tmdbResults.results || tmdbResults.results.length === 0) {
        break; // No more results
      }

      for (const tmdbMovie of tmdbResults.results) {
      // Check if already exists
      const existing = await prisma.movie.findFirst({
        where: { tmdbId: tmdbMovie.id },
      });

      if (existing) {
        skipped.push({ tmdbId: tmdbMovie.id, title: tmdbMovie.title, reason: 'Already exists' });
        continue;
      }

      try {
        // Import using the single import logic
        const movieDetails = await tmdbService.getMovieDetails(tmdbMovie.id);

        const movie = await prisma.movie.create({
          data: {
            title: movieDetails.title,
            releaseYear: movieDetails.release_date ? new Date(movieDetails.release_date).getFullYear() : 1900,
            plot: movieDetails.overview,
            posterUrl: tmdbService.getPosterUrl(movieDetails.poster_path),
            tmdbId: movieDetails.id,
          },
        });

        // Import genres (simplified for bulk)
        for (const tmdbGenre of movieDetails.genres) {
          let genre = await prisma.genre.findFirst({
            where: { name: tmdbGenre.name },
          });

          if (!genre) {
            genre = await prisma.genre.create({
              data: { name: tmdbGenre.name },
            });
          }

          await prisma.movieGenre.create({
            data: { movieId: movie.id, genreId: genre.id },
          });
        }

        imported.push({ tmdbId: movie.tmdbId, title: movie.title });
      } catch (err) {
        logger.error(`Failed to import movie ${tmdbMovie.id}:`, err);
        skipped.push({ tmdbId: tmdbMovie.id, title: tmdbMovie.title, reason: 'Import failed' });
      }
      }
    }

    res.status(200).json({
      message: `Bulk import completed`,
      imported: imported.length,
      skipped: skipped.length,
      details: { imported, skipped },
    });
  } catch (error) {
    logger.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to bulk import movies' });
  }
};
