import { useState } from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Movie, MovieGenre, ExternalRating } from '../types';
import { watchStatusAPI } from '../services/api';
import { useAuth } from '../services/AuthContext';

interface MovieCardProps {
  movie: Movie;
  onViewDetails?: (movieId: string) => void;
  onWatchStatusChange?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onViewDetails, onWatchStatusChange }) => {
  const { isAuthenticated } = useAuth();
  const [isWatched, setIsWatched] = useState(movie.watchStatus?.watched ?? false);
  const [isLoading, setIsLoading] = useState(false);

  const handleWatchToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || isLoading) return;

    setIsLoading(true);
    try {
      await watchStatusAPI.toggleWatchStatus(movie.id, {
        watched: !isWatched,
        watchedDate: !isWatched ? new Date().toISOString() : undefined
      });
      setIsWatched(!isWatched);
      onWatchStatusChange?.();
    } catch (error) {
      console.error('Failed to toggle watch status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      {movie.posterUrl && (
        <Card.Img variant="top" src={movie.posterUrl} style={{ height: '300px', objectFit: 'cover' }} alt={movie.title}/>
      )}
      <Card.Body>
        <Card.Title style={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '3rem'}}>
          {movie.title}
        </Card.Title>
        <Card.Text className="text-muted">{movie.releaseYear}</Card.Text>
        <div className="mb-2">
          {movie.genres?.map((mg: MovieGenre) => (
            <Badge key={mg.id} bg="secondary" className="me-1">
              {mg.genre.name}
            </Badge>
          ))}
        </div>
        {movie.externalRatings?.map((rating: ExternalRating) => (
          <div key={rating.id} className="mb-1">
            <Badge bg="warning" text="dark">
              {rating.source}: {rating.rating}/10
            </Badge>
          </div>
        ))}
        <div className="d-flex gap-2 mt-2">
          {isAuthenticated && (
            <Button
              variant={isWatched ? 'success' : 'outline-secondary'}
              size="sm"
              onClick={handleWatchToggle}
              disabled={isLoading}
              className="d-flex align-items-center gap-1"
            >
              {isWatched ? <FaEye /> : <FaEyeSlash />}
              {isWatched ? 'Watched' : 'Watch'}
            </Button>
          )}
          <Button variant="dark" size="sm" onClick={() => onViewDetails?.(movie.id)} className="flex-grow-1">
            View Details
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};
