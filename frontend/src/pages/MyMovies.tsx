import { Card, Table, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useRatings } from '../hooks';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MessageModal } from '../components/MessageModal';

export default function MyMovies() {
  const { ratings, loading, error } = useRatings();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-4">My Watched Movies</h1>

      {error && (
        <MessageModal
          show={true}
          title="Error"
          message={error}
          variant="danger"
          onClose={() => window.location.reload()}
        />
      )}

      {ratings.length === 0 ? (
        <Alert variant="info">
          You haven't rated any movies yet. <Link to="/">Browse movies</Link> to get started!
        </Alert>
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
