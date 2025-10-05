// User Types
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
  isBlocked: boolean;
}

// Movie Types
export interface Movie {
  id: string;
  title: string;
  releaseYear: number;
  plot?: string;
  posterUrl?: string;
  backdropUrl?: string;
  rating?: number;
  voteCount?: number;
  tmdbId?: number;
  source?: 'tmdb' | 'local';
  genres?: MovieGenre[];
  externalRatings?: ExternalRating[];
  credits?: Credit[];
  userRatings?: UserRating[];
}

export interface Genre {
  id: string;
  name: string;
}

export interface MovieGenre {
  id: string;
  genre: Genre;
}

export interface ExternalRating {
  id: string;
  source: string;
  rating: number;
  ratingCount?: number;
}

export interface Person {
  id: string;
  name: string;
  type: string;
}

export interface Credit {
  id: string;
  person: Person;
  role: string;
  characterName?: string;
}

// Rating Types
export interface UserRating {
  id: string;
  rating: number;
  review?: string;
  watchedDate: string;
  movie: Movie;
  user: User;
}

export interface CreateRatingInput {
  movieId: string;
  rating: number;
  review?: string;
  watchedDate: string;
}

// Collection Types
export interface Collection {
  id: string;
  name: string;
  description?: string;
  movies: CollectionMovie[];
}

export interface CollectionMovie {
  id: string;
  movie: Movie;
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
}

// Auth Types
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API Response Types
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MoviesResponse {
  movies: Movie[];
  pagination?: PaginationMeta;
}

export interface UsersResponse {
  users: User[];
}

export interface RatingsResponse {
  ratings: UserRating[];
}

export interface CollectionsResponse {
  collections: Collection[];
}

export interface GenresResponse {
  genres: Genre[];
}

// Search/Filter Types
export interface MovieSearchParams {
  title?: string;
  genre?: string;
  person?: string;
  page?: number;
  limit?: number;
}

export interface PersonSearchParams {
  name?: string;
  type?: string;
}
