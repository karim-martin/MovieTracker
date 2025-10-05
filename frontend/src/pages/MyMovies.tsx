import { useState, useEffect } from 'react';
import { Card, Table, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ratingAPI } from '../api';

export default function MyMovies() {
  const [ratings, setRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyRatings();
  }, []);

  const fetchMyRatings = async () => {
    try {
      const response = await ratingAPI.getMyRatings();
      setRatings(response.data.ratings);
    } catch (err) {
      setError('Failed to load your movies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <h1 className="mb-4">My Watched Movies</h1>
      {ratings.length === 0 ? (
        <Alert variant="info">You haven't rated any movies yet. <Link to="/">Browse movies</Link> to get started!</Alert>
      ) : (
        <Card>
          <Card.Body>
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Movie</th>
                  <th>Year</th>
                  <th>My Rating</th>
                  <th>Watched Date</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating) => (
                  <tr key={rating.id}>
                    <td>
                      <Link to={`/movies/${rating.movie.id}`}>{rating.movie.title}</Link>
                    </td>
                    <td>{rating.movie.releaseYear}</td>
                    <td>
                      <Badge bg="primary">{rating.rating}/10</Badge>
                    </td>
                    <td>{new Date(rating.watchedDate).toLocaleDateString()}</td>
                    <td>{rating.review || <span className="text-muted">No review</span>}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
