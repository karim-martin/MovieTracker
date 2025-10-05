import { Card, Badge, Button } from 'react-bootstrap';
import { Movie } from '../../types';

interface MovieCardProps {
  movie: Movie;
  onViewDetails?: (movieId: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onViewDetails }) => {
  return (
    <Card>
      {movie.posterUrl && (
        <Card.Img
          variant="top"
          src={movie.posterUrl}
          style={{ height: '300px', objectFit: 'cover' }}
          alt={movie.title}
        />
      )}
      <Card.Body>
        <Card.Title>{movie.title}</Card.Title>
        <Card.Text className="text-muted">{movie.releaseYear}</Card.Text>
        <div className="mb-2">
          {movie.genres?.map((mg) => (
            <Badge key={mg.id} bg="secondary" className="me-1">
              {mg.genre.name}
            </Badge>
          ))}
        </div>
        {movie.externalRatings?.map((rating) => (
          <div key={rating.id} className="mb-1">
            <Badge bg="warning" text="dark">
              {rating.source}: {rating.rating}/10
            </Badge>
          </div>
        ))}
        <Button
          variant="dark"
          size="sm"
          className="mt-2"
          onClick={() => onViewDetails?.(movie.id)}
        >
          View Details
        </Button>
      </Card.Body>
    </Card>
  );
};
