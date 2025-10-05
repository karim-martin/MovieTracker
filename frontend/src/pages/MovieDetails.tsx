import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Badge, Form, Button } from 'react-bootstrap';
import { useMovie } from '../hooks';
import { LoadingSpinner, MessageModal } from '../components/common';
import { useAuth } from '../AuthContext';
import { ratingAPI } from '../services/api';

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const { movie, loading, error, refetch } = useMovie(id!);

  const [rating, setRating] = useState('');
  const [review, setReview] = useState('');
  const [watchedDate, setWatchedDate] = useState('');
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });
  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await ratingAPI.createRating({
        movieId: id!,
        rating: parseFloat(rating),
        review,
        watchedDate,
      });
      setSuccessModal({ show: true, message: 'Rating submitted successfully!' });
      setRating('');
      setReview('');
      setWatchedDate('');
      refetch();
    } catch (err: any) {
      setErrorModal({ show: true, message: err.response?.data?.error || 'Failed to submit rating' });
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <MessageModal
        show={true}
        title="Error"
        message={error}
        variant="danger"
        onClose={() => window.history.back()}
      />
    );
  }

  if (!movie) {
    return (
      <MessageModal
        show={true}
        title="Not Found"
        message="Movie not found"
        variant="warning"
        onClose={() => window.history.back()}
      />
    );
  }

  return (
    <div>
      <Row>
        <Col md={4}>
          {movie.posterUrl && (
            <img src={movie.posterUrl} alt={movie.title} className="img-fluid rounded" />
          )}
        </Col>
        <Col md={8}>
          <h1>{movie.title}</h1>
          <h4 className="text-muted">{movie.releaseYear}</h4>
          <div className="mb-3">
            {movie.genres?.map((mg) => (
              <Badge key={mg.id} bg="secondary" className="me-1">
                {mg.genre.name}
              </Badge>
            ))}
          </div>
          {movie.plot && <p>{movie.plot}</p>}

          <h5>External Ratings</h5>
          {movie.externalRatings?.map((rating) => (
            <div key={rating.id}>
              <Badge bg="warning" text="dark" className="me-2">
                {rating.source}: {rating.rating}/10
              </Badge>
              {rating.ratingCount && <span className="text-muted">({rating.ratingCount} votes)</span>}
            </div>
          ))}

          <h5 className="mt-3">Cast & Crew</h5>
          {movie.credits?.map((credit) => (
            <div key={credit.id}>
              <strong>{credit.person.name}</strong> - {credit.role}
              {credit.characterName && ` as ${credit.characterName}`}
            </div>
          ))}

          {isAuthenticated && (
            <Card className="mt-4">
              <Card.Body>
                <h5>Rate This Movie</h5>
                <Form onSubmit={handleRatingSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Rating (0-10)</Form.Label>
                    <Form.Control
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Review (Optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Watched Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={watchedDate}
                      onChange={(e) => setWatchedDate(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button variant="primary" type="submit">
                    Submit Rating
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          )}

          <h5 className="mt-4">User Ratings</h5>
          {movie.userRatings?.length === 0 ? (
            <p className="text-muted">No user ratings yet</p>
          ) : (
            movie.userRatings?.map((userRating) => (
              <Card key={userRating.id} className="mb-2">
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <strong>{userRating.user.username}</strong>
                    <Badge bg="primary">{userRating.rating}/10</Badge>
                  </div>
                  {userRating.review && <p className="mt-2 mb-0">{userRating.review}</p>}
                </Card.Body>
              </Card>
            ))
          )}
        </Col>
      </Row>

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
    </div>
  );
}
