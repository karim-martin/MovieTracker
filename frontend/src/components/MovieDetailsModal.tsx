import { useState, useEffect } from 'react';
import { Modal, Row, Col, Badge, Form, Button, Card } from 'react-bootstrap';
import { MessageModal } from '.';
import { useAuth } from '../AuthContext';
import { ratingAPI } from '../services/api';
import { Movie, Credit, MovieGenre, ExternalRating, UserRating } from '../types';

interface MovieDetailsModalProps {
  show: boolean;
  movie: Movie | null;
  onClose: () => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  show,
  movie,
  onClose,
}) => {
  const { isAuthenticated } = useAuth();

  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [watchedDate, setWatchedDate] = useState('');
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });
  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      setRating(0);
      setHoveredStar(0);
      setWatchedDate('');
    }
  }, [show]);

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setErrorModal({ show: true, message: 'Please select a rating' });
      return;
    }

    try {
      await ratingAPI.createRating({
        movieId: movie!.id,
        rating: rating * 2, // Convert 5-star to 10-point scale
        watchedDate,
      });
      setSuccessModal({ show: true, message: 'Rating submitted successfully!' });
      setRating(0);
      setHoveredStar(0);
      setWatchedDate('');
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setErrorModal({ show: true, message: error.response?.data?.error || 'Failed to submit rating' });
    }
  };

  const renderStars = () => {
    return (
      <div style={{ fontSize: '2rem', cursor: 'pointer' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
            style={{
              color: star <= (hoveredStar || rating) ? '#ffc107' : '#e4e5e9',
              marginRight: '0.25rem',
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (!show || !movie) return null;

  // Separate credits by role
  const directors = movie.credits?.filter((c: Credit) => c.role.toLowerCase() === 'director') || [];
  const producers = movie.credits?.filter((c: Credit) => c.role.toLowerCase() === 'producer') || [];
  const cast = movie.credits?.filter((c: Credit) => c.role.toLowerCase() === 'actor') || [];

  // Calculate internal rating (average of user ratings)
  const internalRating = movie.userRatings?.length
    ? (movie.userRatings.reduce((sum: number, r: UserRating) => sum + r.rating, 0) / movie.userRatings.length).toFixed(1)
    : 'N/A';

  return (
    <>
      <Modal show={show} onHide={onClose} size="xl" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>{movie.title} ({movie.releaseYear})</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col md={4}>
              {movie.posterUrl && (
                <img src={movie.posterUrl} alt={movie.title} className="img-fluid rounded mb-3" />
              )}
            </Col>
            <Col md={8}>
              {/* Genres */}
              <div className="mb-3">
                <strong>Genres: </strong>
                {movie.genres?.map((mg: MovieGenre) => (
                  <Badge key={mg.id} bg="secondary" className="me-1">
                    {mg.genre.name}
                  </Badge>
                ))}
              </div>

              {/* Plot */}
              {movie.plot && (
                <div className="mb-3">
                  <strong>Plot:</strong>
                  <p>{movie.plot}</p>
                </div>
              )}

              {/* Directors */}
              {directors.length > 0 && (
                <div className="mb-3">
                  <strong>Director{directors.length > 1 ? 's' : ''}:</strong>
                  <div>
                    {directors.map((credit: Credit) => (
                      <span key={credit.id} className="me-2">
                        {credit.person.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Producers */}
              {producers.length > 0 && (
                <div className="mb-3">
                  <strong>Producer{producers.length > 1 ? 's' : ''}:</strong>
                  <div>
                    {producers.map((credit: Credit) => (
                      <span key={credit.id} className="me-2">
                        {credit.person.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cast */}
              {cast.length > 0 && (
                <div className="mb-3">
                  <strong>Cast:</strong>
                  <div>
                    {cast.map((credit: Credit) => (
                      <div key={credit.id}>
                        <span>{credit.person.name}</span>
                        {credit.characterName && <span className="text-muted"> as {credit.characterName}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Ratings */}
              <div className="mb-3">
                <strong>External Ratings:</strong>
                <div>
                  {movie.externalRatings?.length ? (
                    movie.externalRatings.map((rating: ExternalRating) => (
                      <div key={rating.id} className="mb-1">
                        <Badge bg="warning" text="dark" className="me-2">
                          {rating.source}: {rating.rating}/10
                        </Badge>
                        {rating.ratingCount && <span className="text-muted">({rating.ratingCount} votes)</span>}
                      </div>
                    ))
                  ) : movie.rating ? (
                    <div className="mb-1">
                      <Badge bg="warning" text="dark" className="me-2">
                        TMDB: {movie.rating}/10
                      </Badge>
                      {movie.voteCount && <span className="text-muted">({movie.voteCount} votes)</span>}
                    </div>
                  ) : (
                    <span className="text-muted">No external ratings available</span>
                  )}
                </div>
              </div>

              {/* Internal Rating */}
              <div className="mb-3">
                <strong>Internal Rating:</strong>
                <div>
                  <Badge bg="info" className="me-2">
                    {internalRating}/10
                  </Badge>
                  {movie.userRatings?.length ? (
                    <span className="text-muted">({movie.userRatings.length} user rating{movie.userRatings.length !== 1 ? 's' : ''})</span>
                  ) : (
                    <span className="text-muted">(No user ratings yet)</span>
                  )}
                </div>
              </div>

              {/* Rate Movie Section (only for authenticated users) */}
              {isAuthenticated && (
                <Card className="mt-4">
                  <Card.Body>
                    <h5>Rate This Movie</h5>
                    <Form onSubmit={handleRatingSubmit}>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Rating</Form.Label>
                            {renderStars()}
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Watched Date</Form.Label>
                            <Form.Control
                              type="date"
                              value={watchedDate}
                              onChange={(e) => setWatchedDate(e.target.value)}
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Button variant="primary" type="submit">
                        Submit Rating
                      </Button>
                    </Form>
                  </Card.Body>
                </Card>
              )}

              {/* User Ratings - Only show if there are ratings */}
              {movie.userRatings && movie.userRatings.length > 0 && (
                <>
                  <h5 className="mt-4">User Ratings</h5>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {movie.userRatings.map((userRating: UserRating) => (
                      <Card key={userRating.id} className="mb-2">
                        <Card.Body>
                          <div className="d-flex justify-content-between">
                            <strong>{userRating.user.username}</strong>
                            <Badge bg="primary">{userRating.rating}/10</Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Error Modal */}
      <MessageModal
        show={errorModal.show}
        title="Error"
        message={errorModal.message}
        variant="danger"
        onClose={() => setErrorModal({ show: false, message: '' })}
      />

      {/* Success Modal */}
      <MessageModal
        show={successModal.show}
        title="Success"
        message={successModal.message}
        variant="success"
        onClose={() => setSuccessModal({ show: false, message: '' })}
      />
    </>
  );
};
