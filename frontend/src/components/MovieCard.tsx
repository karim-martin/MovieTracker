import { Card, Badge, Button } from 'react-bootstrap';
import { FaEye, FaStar } from 'react-icons/fa';
import { Movie, MovieGenre, ExternalRating } from '../types';

interface MovieCardProps {
  movie: Movie;
  onViewDetails?: (movieId: string) => void;
  onWatchStatusChange?: () => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onViewDetails }) => {
  const isWatched = movie.watchStatus?.watched ?? false;
  const hasRating = movie.userRating !== undefined && movie.userRating !== null;
  const userRatingValue = hasRating ? movie.userRating?.rating : null;

  // Determine button variant and text based on status
  const getButtonVariant = () => {
    if (hasRating) return 'success';
    if (isWatched) return 'primary';
    return 'dark';
  };

  const getButtonText = () => {
    if (hasRating) return 'Rated';
    if (isWatched) return 'Watched';
    return 'View Details';
  };

  return (
    <Card className={hasRating || isWatched ? 'border-success' : ''} style={hasRating || isWatched ? { borderWidth: '2px' } : {}}>
      {movie.posterUrl && (
        <div style={{ position: 'relative' }}>
          <Card.Img variant="top" src={movie.posterUrl} style={{ height: '300px', objectFit: 'cover' }} alt={movie.title}/>
          {(isWatched || hasRating) && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              display: 'flex',
              gap: '4px'
            }}>
              {isWatched && (
                <Badge bg="success" className="d-flex align-items-center gap-1">
                  <FaEye /> Watched
                </Badge>
              )}
              {hasRating && userRatingValue && (
                <Badge bg="warning" text="dark" className="d-flex align-items-center gap-1">
                  <FaStar /> {userRatingValue}/10
                </Badge>
              )}
            </div>
          )}
        </div>
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
        <div className="mt-2">
          <Button
            variant={getButtonVariant()}
            size="sm"
            onClick={() => onViewDetails?.(movie.id)}
            className="w-100 d-flex align-items-center justify-content-center gap-1"
          >
            {hasRating && <FaStar />}
            {!hasRating && isWatched && <FaEye />}
            {getButtonText()}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};
