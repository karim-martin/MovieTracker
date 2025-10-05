import { Request, Response } from 'express';
import { tmdbService } from '../services/tmdbService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Search movies from TMDB
 */
export const searchMovies = async (req: Request, res: Response) => {
  try {
    const { query, page = 1 } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const results = await tmdbService.searchMovies(query, Number(page));

    // Add full image URLs
    const moviesWithImages = results.results.map((movie) => ({
      ...movie,
      poster_url: tmdbService.getPosterUrl(movie.poster_path),
      backdrop_url: tmdbService.getBackdropUrl(movie.backdrop_path),
    }));

    res.json({
      results: moviesWithImages,
      page: Number(page),
      total_pages: results.total_pages,
      total_results: results.total_results,
    });
  } catch (error) {
    console.error('Error searching movies:', error);
    res.status(500).json({ error: 'Failed to search movies' });
  }
};

/**
 * Get popular movies from TMDB
 */
export const getPopularMovies = async (req: Request, res: Response) => {
  try {
    const { page = 1 } = req.query;
    const results = await tmdbService.getPopularMovies(Number(page));

    const moviesWithImages = results.results.map((movie) => ({
      ...movie,
      poster_url: tmdbService.getPosterUrl(movie.poster_path),
      backdrop_url: tmdbService.getBackdropUrl(movie.backdrop_path),
    }));

    res.json({
      results: moviesWithImages,
      page: Number(page),
      total_pages: results.total_pages,
      total_results: results.total_results,
    });
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.status(500).json({ error: 'Failed to fetch popular movies' });
  }
};

/**
 * Get top rated movies from TMDB
 */
export const getTopRatedMovies = async (req: Request, res: Response) => {
  try {
    const { page = 1 } = req.query;
    const results = await tmdbService.getTopRatedMovies(Number(page));

    const moviesWithImages = results.results.map((movie) => ({
      ...movie,
      poster_url: tmdbService.getPosterUrl(movie.poster_path),
      backdrop_url: tmdbService.getBackdropUrl(movie.backdrop_path),
    }));

    res.json({
      results: moviesWithImages,
      page: Number(page),
      total_pages: results.total_pages,
      total_results: results.total_results,
    });
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    res.status(500).json({ error: 'Failed to fetch top rated movies' });
  }
};

/**
 * Get now playing movies from TMDB
 */
export const getNowPlayingMovies = async (req: Request, res: Response) => {
  try {
    const { page = 1 } = req.query;
    const results = await tmdbService.getNowPlayingMovies(Number(page));

    const moviesWithImages = results.results.map((movie) => ({
      ...movie,
      poster_url: tmdbService.getPosterUrl(movie.poster_path),
      backdrop_url: tmdbService.getBackdropUrl(movie.backdrop_path),
    }));

    res.json({
      results: moviesWithImages,
      page: Number(page),
      total_pages: results.total_pages,
      total_results: results.total_results,
    });
  } catch (error) {
    console.error('Error fetching now playing movies:', error);
    res.status(500).json({ error: 'Failed to fetch now playing movies' });
  }
};

/**
 * Get upcoming movies from TMDB
 */
export const getUpcomingMovies = async (req: Request, res: Response) => {
  try {
    const { page = 1 } = req.query;
    const results = await tmdbService.getUpcomingMovies(Number(page));

    const moviesWithImages = results.results.map((movie) => ({
      ...movie,
      poster_url: tmdbService.getPosterUrl(movie.poster_path),
      backdrop_url: tmdbService.getBackdropUrl(movie.backdrop_path),
    }));

    res.json({
      results: moviesWithImages,
      page: Number(page),
      total_pages: results.total_pages,
      total_results: results.total_results,
    });
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming movies' });
  }
};

/**
 * Get movie details from TMDB
 */
export const getMovieDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movieDetails = await tmdbService.getMovieDetails(Number(id));

    const movieWithImages = {
      ...movieDetails,
      poster_url: tmdbService.getPosterUrl(movieDetails.poster_path),
      backdrop_url: tmdbService.getBackdropUrl(movieDetails.backdrop_path),
    };

    res.json(movieWithImages);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
};

/**
 * Get movie genres from TMDB
 */
export const getGenres = async (req: Request, res: Response) => {
  try {
    const genres = await tmdbService.getGenres();
    res.json(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ error: 'Failed to fetch genres' });
  }
};

/**
 * Discover movies by genre from TMDB
 */
export const discoverByGenre = async (req: Request, res: Response) => {
  try {
    const { genreId } = req.params;
    const { page = 1 } = req.query;

    const results = await tmdbService.discoverByGenre(Number(genreId), Number(page));

    const moviesWithImages = results.results.map((movie) => ({
      ...movie,
      poster_url: tmdbService.getPosterUrl(movie.poster_path),
      backdrop_url: tmdbService.getBackdropUrl(movie.backdrop_path),
    }));

    res.json({
      results: moviesWithImages,
      page: Number(page),
      total_pages: results.total_pages,
      total_results: results.total_results,
    });
  } catch (error) {
    console.error('Error discovering movies by genre:', error);
    res.status(500).json({ error: 'Failed to discover movies by genre' });
  }
};

/**
 * Import a movie from TMDB to local database (Admin only)
 */
export const importMovieFromTMDB = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const movieDetails = await tmdbService.getMovieDetails(Number(id));

    // Check if movie already exists in database
    const existingMovie = await prisma.movie.findFirst({
      where: {
        title: movieDetails.title,
        releaseYear: new Date(movieDetails.release_date).getFullYear(),
      },
    });

    if (existingMovie) {
      return res.status(409).json({ error: 'Movie already exists in database' });
    }

    // Create movie in database
    const movie = await prisma.movie.create({
      data: {
        title: movieDetails.title,
        releaseYear: new Date(movieDetails.release_date).getFullYear(),
        plot: movieDetails.overview,
        posterUrl: tmdbService.getPosterUrl(movieDetails.poster_path),
      },
    });

    // Add genres
    for (const genre of movieDetails.genres) {
      let genreRecord = await prisma.genre.findFirst({
        where: { name: genre.name },
      });

      if (!genreRecord) {
        genreRecord = await prisma.genre.create({
          data: { name: genre.name },
        });
      }

      await prisma.movieGenre.create({
        data: {
          movieId: movie.id,
          genreId: genreRecord.id,
        },
      });
    }

    // Add IMDB rating if available
    if (movieDetails.vote_average) {
      await prisma.externalRating.create({
        data: {
          movieId: movie.id,
          source: 'IMDB',
          rating: movieDetails.vote_average,
          ratingCount: movieDetails.vote_count,
        },
      });
    }

    // Add cast and crew
    if (movieDetails.credits) {
      // Add top 10 actors
      const topCast = movieDetails.credits.cast.slice(0, 10);
      for (const actor of topCast) {
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
            role: 'Actor',
            characterName: actor.character,
          },
        });
      }

      // Add directors
      const directors = movieDetails.credits.crew.filter((crew) => crew.job === 'Director');
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
            role: 'Director',
          },
        });
      }
    }

    // Fetch the complete movie with relations
    const completeMovie = await prisma.movie.findUnique({
      where: { id: movie.id },
      include: {
        genres: {
          include: { genre: true },
        },
        credits: {
          include: { person: true },
        },
        externalRatings: true,
      },
    });

    res.status(201).json(completeMovie);
  } catch (error) {
    console.error('Error importing movie from TMDB:', error);
    res.status(500).json({ error: 'Failed to import movie from TMDB' });
  }
};
