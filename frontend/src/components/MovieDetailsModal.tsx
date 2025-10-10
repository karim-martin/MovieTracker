import { useState, useEffect } from 'react';
import { Modal, Row, Col, Badge, Form, Button, Card } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MessageModal } from '.';
import { useAuth } from '../services/AuthContext';
import { ratingAPI, movieAPI, watchStatusAPI } from '../services/api';
import { Movie, Credit, MovieGenre, ExternalRating, UserRating } from '../types';

interface MovieDetailsModalProps {
  show: boolean;
  movie: Movie | null;
  onClose: () => void;
  onRatingSuccess?: () => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  show,
  movie,
  onClose,
  onRatingSuccess,
}) => {
  const { isAuthenticated, user } = useAuth();

  const [fullMovie, setFullMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [watchedDate, setWatchedDate] = useState('');
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);
  const [isWatched, setIsWatched] = useState(false);
  const [isWatchLoading, setIsWatchLoading] = useState(false);
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });
  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: '',
  });

  // Fetch full movie details when modal opens
  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!show || !movie?.id) {
        setFullMovie(null);
        setRating(0);
        setHoveredStar(0);
        setWatchedDate('');
        setExistingRatingId(null);
        return;
      }

      setLoading(true);
      try {
        const response = await movieAPI.getMovieById(movie.id);
        const movieData = response.data.movie;
        setFullMovie(movieData);
        setIsWatched(movieData.watchStatus?.watched ?? false);

        // Check if current user has already rated this movie
        if (isAuthenticated && user && movieData.userRatings) {
          const userRating = movieData.userRatings.find((r: UserRating) => r.user?.id === user.id);
          if (userRating) {
            setRating(userRating.rating / 2); // Convert from 10-point to 5-star scale
            setWatchedDate(userRating.watchedDate ? new Date(userRating.watchedDate).toISOString().split('T')[0] : '');
            setExistingRatingId(userRating.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch movie details:', error);
        setErrorModal({ show: true, message: 'Failed to load movie details' });
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [show, movie?.id, isAuthenticated, user]);

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setErrorModal({ show: true, message: 'Please select a rating' });
      return;
    }

    try {
      if (existingRatingId) {
        // Update existing rating
        await ratingAPI.updateRating(existingRatingId, {
          rating: rating * 2, // Convert 5-star to 10-point scale
          watchedDate,
        });
        setSuccessModal({ show: true, message: 'Rating updated successfully!' });
      } else {
        // Create new rating
        await ratingAPI.createRating({
          movieId: movie!.id,
          rating: rating * 2, // Convert 5-star to 10-point scale
          watchedDate,
        });
        setSuccessModal({ show: true, message: 'Rating submitted successfully!' });
      }

      // Trigger refetch of movies to update watch status
      onRatingSuccess?.();

      // Refetch movie details to update the display
      const response = await movieAPI.getMovieById(movie!.id);
      setFullMovie(response.data.movie);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setErrorModal({ show: true, message: error.response?.data?.error || 'Failed to submit rating' });
    }
  };

  const handleWatchToggle = async () => {
    if (!isAuthenticated || isWatchLoading || !fullMovie) return;

    setIsWatchLoading(true);
    try {
      await watchStatusAPI.toggleWatchStatus(fullMovie.id, {
        watched: !isWatched,
        watchedDate: !isWatched ? new Date().toISOString() : undefined
      });
      setIsWatched(!isWatched);
      onRatingSuccess?.();
    } catch (error) {
      console.error('Failed to toggle watch status:', error);
      setErrorModal({ show: true, message: 'Failed to update watch status' });
    } finally {
      setIsWatchLoading(false);
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

  // Use fullMovie if loaded, otherwise fall back to movie prop
  const displayMovie = fullMovie || movie;

  // Separate credits by role
  const directors = displayMovie.credits?.filter((c: Credit) => c.role.toLowerCase() === 'director') || [];
  const producers = displayMovie.credits?.filter((c: Credit) => c.role.toLowerCase() === 'producer') || [];
  const cast = displayMovie.credits?.filter((c: Credit) => c.role.toLowerCase() === 'actor') || [];

  // Calculate internal rating (average of user ratings)
  const internalRating = displayMovie.userRatings?.length
    ? (displayMovie.userRatings.reduce((sum: number, r: UserRating) => sum + r.rating, 0) / displayMovie.userRatings.length).toFixed(1)
    : 'N/A';

  return (
    <>
      <Modal show={show} onHide={onClose} size="xl" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            {displayMovie.title} ({displayMovie.releaseYear})
            {isAuthenticated && (
              <Button
                variant={isWatched ? 'success' : 'outline-secondary'}
                size="sm"
                onClick={handleWatchToggle}
                disabled={isWatchLoading}
                className="ms-3 d-inline-flex align-items-center gap-1"
              >
                {isWatched ? <FaEye /> : <FaEyeSlash />}
                {isWatched ? 'Watched' : 'Mark as Watched'}
              </Button>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <Row>
              <Col md={4}>
                {displayMovie.posterUrl && (
                  <img src={displayMovie.posterUrl} alt={displayMovie.title} className="img-fluid rounded mb-3" />
                )}
              </Col>
              <Col md={8}>
                {/* Genres */}
                <div className="mb-3">
                  <strong>Genres: </strong>
                  {displayMovie.genres?.map((mg: MovieGenre) => (
                    <Badge key={mg.id} bg="secondary" className="me-1">
                      {mg.genre.name}
                    </Badge>
                  ))}
                </div>

                {/* Plot */}
                {displayMovie.plot && (
                  <div className="mb-3">
                    <strong>Plot:</strong>
                    <p>{displayMovie.plot}</p>
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
                    {displayMovie.externalRatings?.length ? (
                      displayMovie.externalRatings.map((rating: ExternalRating) => (
                        <div key={rating.id} className="mb-1">
                          <Badge bg="warning" text="dark" className="me-2">
                            {rating.source}: {rating.rating}/10
                          </Badge>
                          {rating.ratingCount && <span className="text-muted">({rating.ratingCount} votes)</span>}
                        </div>
                      ))
                    ) : displayMovie.rating ? (
                      <div className="mb-1">
                        <Badge bg="warning" text="dark" className="me-2">
                          TMDB: {displayMovie.rating}/10
                        </Badge>
                        {displayMovie.voteCount && <span className="text-muted">({displayMovie.voteCount} votes)</span>}
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
                    {displayMovie.userRatings?.length ? (
                      <span className="text-muted">({displayMovie.userRatings.length} user rating{displayMovie.userRatings.length !== 1 ? 's' : ''})</span>
                    ) : (
                      <span className="text-muted">(No user ratings yet)</span>
                    )}
                  </div>
                </div>

                {/* Rate Movie Section (only for authenticated users) */}
                {isAuthenticated && (
                  <Card className="mt-4">
                    <Card.Body>
                      <h5>{existingRatingId ? 'Update Your Rating' : 'Rate This Movie'}</h5>
                      <Form onSubmit={handleRatingSubmit}>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3" controlId="rating">
                              <Form.Label>Rating</Form.Label>
                              {renderStars()}
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3" controlId="watchedDate">
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
                          {existingRatingId ? 'Update Rating' : 'Submit Rating'}
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                )}

                {/* User Ratings - Only show if there are ratings with user info */}
                {displayMovie.userRatings && displayMovie.userRatings.length > 0 && displayMovie.userRatings.some((r: UserRating) => r.user) && (
                  <>
                    <h5 className="mt-4">User Ratings</h5>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                      {displayMovie.userRatings
                        .filter((userRating: UserRating) => userRating.user)
                        .map((userRating: UserRating) => (
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
          )}
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
