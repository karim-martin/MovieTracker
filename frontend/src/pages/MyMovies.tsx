import { Card, Table, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useMyMovies } from '../hooks';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MessageModal } from '../components/MessageModal';

export default function MyMovies() {
  const { movies, loading, error } = useMyMovies();

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-4">My Movies</h1>

      {error && (
        <MessageModal
          show={true}
          title="Error"
          message={error}
          variant="danger"
          onClose={() => window.location.reload()}
        />
      )}

      {movies.length === 0 ? (
        <Alert variant="info">
          You haven't watched or rated any movies yet. <Link to="/">Browse movies</Link> to get started!
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
                  <th>Last Action Date</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((movie) => (
                  <tr key={movie.id}>
                    <td>
                      <Link to={`/movies/${movie.id}`}>{movie.title}</Link>
                    </td>
                    <td>{movie.releaseYear}</td>
                    <td>
                      {movie.userRating ? (
                        <Badge bg="primary">{movie.userRating.rating}/10</Badge>
                      ) : (
                        <Badge bg="secondary">Not Rated</Badge>
                      )}
                    </td>
                    <td>{new Date(movie.lastActionDate || '').toLocaleDateString()}</td>
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
