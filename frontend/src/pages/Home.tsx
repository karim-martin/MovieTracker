import { useState } from 'react';
import { Card, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useMovies } from '../hooks';
import { LoadingSpinner, MovieCard, MessageModal } from '../components/common';
import { MovieSearchParams } from '../types';

export default function Home() {
  const [searchParams, setSearchParams] = useState<MovieSearchParams>({});
  const [searchTitle, setSearchTitle] = useState('');
  const [searchGenre, setSearchGenre] = useState('');
  const [searchPerson, setSearchPerson] = useState('');

  const { movies, loading, error } = useMovies(searchParams);

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

      <Row>
        {movies.length === 0 ? (
          <Col>
            <Alert variant="info">No movies found. Try adjusting your search.</Alert>
          </Col>
        ) : (
          movies.map((movie) => (
            <Col md={4} key={movie.id} className="mb-4">
              <MovieCard movie={movie} />
            </Col>
          ))
        )}
      </Row>
    </div>
  );
}
