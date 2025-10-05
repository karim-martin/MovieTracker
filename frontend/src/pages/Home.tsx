import { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Badge, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { movieAPI, genreAPI } from '../api';

export default function Home() {
  const [movies, setMovies] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchGenre, setSearchGenre] = useState('');
  const [searchPerson, setSearchPerson] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGenres();
    fetchMovies();
  }, []);

  const fetchGenres = async () => {
    try {
      const response = await genreAPI.getAllGenres();
      setGenres(response.data.genres);
    } catch (err) {
      console.error('Failed to fetch genres');
    }
  };

  const fetchMovies = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (searchTitle) params.title = searchTitle;
      if (searchGenre) params.genre = searchGenre;
      if (searchPerson) params.person = searchPerson;

      const response = await movieAPI.getAllMovies(params);
      setMovies(response.data.movies);
    } catch (err: any) {
      setError('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMovies();
  };

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

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center">Loading...</div>
      ) : (
        <Row>
          {movies.length === 0 ? (
            <Col>
              <Alert variant="info">No movies found. Try adjusting your search.</Alert>
            </Col>
          ) : (
            movies.map((movie) => (
              <Col md={4} key={movie.id} className="mb-4">
                <Card>
                  {movie.posterUrl && (
                    <Card.Img variant="top" src={movie.posterUrl} style={{ height: '300px', objectFit: 'cover' }} />
                  )}
                  <Card.Body>
                    <Card.Title>{movie.title}</Card.Title>
                    <Card.Text className="text-muted">{movie.releaseYear}</Card.Text>
                    <div className="mb-2">
                      {movie.genres?.map((mg: any) => (
                        <Badge key={mg.id} bg="secondary" className="me-1">
                          {mg.genre.name}
                        </Badge>
                      ))}
                    </div>
                    {movie.externalRatings?.map((rating: any) => (
                      <div key={rating.id} className="mb-1">
                        <Badge bg="warning" text="dark">
                          {rating.source}: {rating.rating}/10
                        </Badge>
                      </div>
                    ))}
                    <Link to={`/movies/${movie.id}`} className="btn btn-primary btn-sm mt-2">
                      View Details
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            ))
          )}
        </Row>
      )}
    </div>
  );
}
