import { useState } from 'react';
import { Card, Row, Col, Form, Button, Alert, Badge } from 'react-bootstrap';
import { useMovies, useRecommendations } from '../hooks';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { MovieCard } from '../components/MovieCard';
import { MessageModal } from '../components/MessageModal';
import { MovieDetailsModal } from '../components/MovieDetailsModal';
import { MovieSearchParams, Movie } from '../types';
import { useAuth } from '../AuthContext';

export default function Home() {
  const [searchParams, setSearchParams] = useState<MovieSearchParams>({});
  const [searchTitle, setSearchTitle] = useState('');
  const [searchGenre, setSearchGenre] = useState('');
  const [searchPerson, setSearchPerson] = useState('');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const { isAuthenticated } = useAuth();
  const { movies, loading, error } = useMovies(searchParams);
  const { recommendations, loading: recsLoading } = useRecommendations(10, !isAuthenticated);

  const handleViewDetails = (movieId: string) => {
    const movie = [...movies, ...recommendations].find(m => m.id === movieId);
    if (movie) {
      setSelectedMovie(movie);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: MovieSearchParams = {};
    if (searchTitle) params.title = searchTitle;
    if (searchGenre) params.genre = searchGenre;
    if (searchPerson) params.person = searchPerson;
    setSearchParams(params);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-4">Browse Movies</h1>

      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by title"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Genre</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by genre"
                    value={searchGenre}
                    onChange={(e) => setSearchGenre(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Cast/Director</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by person"
                    value={searchPerson}
                    onChange={(e) => setSearchPerson(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button variant="primary" type="submit" className="w-100 mb-3">
                  Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {error && (
        <MessageModal
          show={true}
          title="Error"
          message={error}
          variant="danger"
          onClose={() => window.location.reload()}
        />
      )}

      {/* AI Recommendations Section - Only for authenticated users */}
      {isAuthenticated && !recsLoading && recommendations.length > 0 && (
        <div className="mb-5">
          <div className="d-flex align-items-center mb-3">
            <h3 className="mb-0 me-2">Recommended For You</h3>
            <Badge bg="info" className="ms-2">AI-Powered</Badge>
          </div>
          <p className="text-muted mb-3">Based on your viewing history and ratings</p>
          <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '1rem' }}>
            <div style={{ display: 'inline-flex', gap: '1rem' }}>
              {recommendations.map((movie) => (
                <div key={movie.id} style={{ width: '280px', display: 'inline-block' }}>
                  <MovieCard movie={movie} onViewDetails={handleViewDetails} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* All Movies Section */}
      <h3 className="mb-3">{isAuthenticated && recommendations.length > 0 ? 'Browse All Movies' : 'Browse Movies'}</h3>
      <Row>
        {movies.length === 0 ? (
          <Col>
            <Alert variant="info">No movies found. Try adjusting your search.</Alert>
          </Col>
        ) : (
          movies.map((movie) => (
            <Col md={3} key={movie.id} className="mb-4">
              <MovieCard movie={movie} onViewDetails={handleViewDetails} />
            </Col>
          ))
        )}
      </Row>

      <MovieDetailsModal
        show={selectedMovie !== null}
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />
    </div>
  );
}
