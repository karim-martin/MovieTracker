import { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Modal, Form, Badge, Pagination, Spinner, Alert } from 'react-bootstrap';
import { movieAPI, genreAPI, personAPI, tmdbAPI } from '../services/api';
import { useUsers } from '../hooks';
import { Movie, APIError, User, Genre, Person } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { MessageModal } from '../components/MessageModal';

interface MovieFormData {
  title: string;
  releaseYear: number | '';
  plot: string;
  posterUrl: string;
  selectedGenres: string[];
  directors: { personId: string; name: string }[];
  producers: { personId: string; name: string }[];
  cast: { personId: string; name: string; characterName: string }[];
}

export default function AdminDashboard() {
  // Movies state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<MovieFormData>({
    title: '',
    releaseYear: '',
    plot: '',
    posterUrl: '',
    selectedGenres: [],
    directors: [],
    producers: [],
    cast: []
  });
  const [currentMoviePage, setCurrentMoviePage] = useState(1);
  const moviesPerPage = 10;

  // Genres and People state
  const [genres, setGenres] = useState<Genre[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [newGenreName, setNewGenreName] = useState('');
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonType, setNewPersonType] = useState<'ACTOR' | 'DIRECTOR' | 'PRODUCER'>('ACTOR');

  // TMDB Import state
  const [showTMDBModal, setShowTMDBModal] = useState(false);
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState('');
  const [tmdbMovies, setTmdbMovies] = useState<any[]>([]);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  const [importingMovies, setImportingMovies] = useState<Set<number>>(new Set());
  const [bulkImporting, setBulkImporting] = useState(false);
  const [tmdbCurrentPage, setTmdbCurrentPage] = useState(1);
  const [tmdbTotalPages, setTmdbTotalPages] = useState(1);

  // Users state
  const { users, loading: usersLoading, error: usersError, blockUser, unblockUser, deleteUser } = useUsers();
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const usersPerPage = 10;

  // Modals state
  const [deleteMovieModal, setDeleteMovieModal] = useState<{ show: boolean; movieId: string; movieTitle: string }>({
    show: false,
    movieId: '',
    movieTitle: ''
  });
  const [deleteUserModal, setDeleteUserModal] = useState<{ show: boolean; userId: string; username: string }>({
    show: false,
    userId: '',
    username: ''
  });
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });
  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });

  const fetchMovies = async () => {
    try {
      const response = await movieAPI.getAllMovies();
      setMovies(response.data.movies);
    } catch (err) {
      const error = err as APIError;
      setErrorModal({ show: true, message: error.message || 'Failed to load movies' });
    } finally {
      setMoviesLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await genreAPI.getAllGenres();
      setGenres(response.data.genres);
    } catch (err) {
      console.error('Failed to load genres:', err);
    }
  };

  const fetchPeople = async () => {
    try {
      const response = await personAPI.getAllPeople();
      setPeople(response.data.people || []);
    } catch (err) {
      console.error('Failed to load people:', err);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchMovies();
    fetchGenres();
    fetchPeople();
  }, []);

  // Movie handlers
  const handleMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build credits array
      const credits = [
        ...formData.directors.map(d => ({ personId: d.personId, role: 'director' })),
        ...formData.producers.map(p => ({ personId: p.personId, role: 'producer' })),
        ...formData.cast.map(c => ({ personId: c.personId, role: 'actor', characterName: c.characterName })),
      ];

      const movieData = {
        title: formData.title,
        releaseYear: Number(formData.releaseYear),
        plot: formData.plot,
        posterUrl: formData.posterUrl,
        genres: formData.selectedGenres,
        credits,
      };

      if (editingMovie) {
        await movieAPI.updateMovie(editingMovie.id, movieData);
        setSuccessModal({ show: true, message: `Movie "${formData.title}" updated successfully!` });
      } else {
        await movieAPI.createMovie(movieData);
        setSuccessModal({ show: true, message: `Movie "${formData.title}" created successfully!` });
      }
      setShowFormModal(false);
      setEditingMovie(null);
      setFormData({
        title: '',
        releaseYear: '',
        plot: '',
        posterUrl: '',
        selectedGenres: [],
        directors: [],
        producers: [],
        cast: []
      });
      fetchMovies();
    } catch (err) {
      const error = err as APIError;
      setErrorModal({ show: true, message: error.response?.data?.error || 'Failed to save movie' });
    }
  };

  const confirmDeleteMovie = async () => {
    try {
      await movieAPI.deleteMovie(deleteMovieModal.movieId);
      setDeleteMovieModal({ show: false, movieId: '', movieTitle: '' });
      setSuccessModal({ show: true, message: `Movie "${deleteMovieModal.movieTitle}" deleted successfully!` });
      fetchMovies();
    } catch (err) {
      const error = err as APIError;
      setDeleteMovieModal({ show: false, movieId: '', movieTitle: '' });
      setErrorModal({ show: true, message: error.message || 'Failed to delete movie' });
    }
  };

  const openEditModal = (movie: Movie) => {
    setEditingMovie(movie);

    // Extract genres
    const selectedGenres = movie.genres?.map(mg => mg.genre.id) || [];

    // Extract directors, producers, and cast
    const directors = movie.credits?.filter(c => c.role.toLowerCase() === 'director').map(c => ({
      personId: c.person.id,
      name: c.person.name
    })) || [];

    const producers = movie.credits?.filter(c => c.role.toLowerCase() === 'producer').map(c => ({
      personId: c.person.id,
      name: c.person.name
    })) || [];

    const cast = movie.credits?.filter(c => c.role.toLowerCase() === 'actor').map(c => ({
      personId: c.person.id,
      name: c.person.name,
      characterName: c.characterName || ''
    })) || [];

    setFormData({
      title: movie.title,
      releaseYear: movie.releaseYear,
      plot: movie.plot || '',
      posterUrl: movie.posterUrl || '',
      selectedGenres,
      directors,
      producers,
      cast
    });
    setShowFormModal(true);
  };

  const openCreateModal = () => {
    setEditingMovie(null);
    setFormData({
      title: '',
      releaseYear: '',
      plot: '',
      posterUrl: '',
      selectedGenres: [],
      directors: [],
      producers: [],
      cast: []
    });
    setShowFormModal(true);
  };

  // User handlers
  const handleBlockUnblock = async (userId: string, isBlocked: boolean, username: string) => {
    try {
      if (isBlocked) {
        await unblockUser(userId);
        setSuccessModal({ show: true, message: `User "${username}" has been unblocked successfully.` });
      } else {
        await blockUser(userId);
        setSuccessModal({ show: true, message: `User "${username}" has been blocked successfully.` });
      }
    } catch (err) {
      const error = err as Error;
      setErrorModal({ show: true, message: error.message });
    }
  };

  const confirmDeleteUser = async () => {
    try {
      await deleteUser(deleteUserModal.userId);
      setDeleteUserModal({ show: false, userId: '', username: '' });
      setSuccessModal({ show: true, message: `User "${deleteUserModal.username}" has been deleted successfully.` });
    } catch (err) {
      const error = err as Error;
      setDeleteUserModal({ show: false, userId: '', username: '' });
      setErrorModal({ show: true, message: error.message });
    }
  };

  // Genre handlers
  const handleCreateGenre = async () => {
    if (!newGenreName.trim()) return;
    try {
      await genreAPI.createGenre({ name: newGenreName });
      setNewGenreName('');
      fetchGenres();
      setSuccessModal({ show: true, message: `Genre "${newGenreName}" created successfully!` });
    } catch (err) {
      const error = err as APIError;
      setErrorModal({ show: true, message: error.response?.data?.error || 'Failed to create genre' });
    }
  };

  // Person handlers
  const handleCreatePerson = async () => {
    if (!newPersonName.trim()) return;
    try {
      await personAPI.createPerson({ name: newPersonName, type: newPersonType });
      setNewPersonName('');
      fetchPeople();
      setSuccessModal({ show: true, message: `Person "${newPersonName}" created successfully!` });
    } catch (err) {
      const error = err as APIError;
      setErrorModal({ show: true, message: error.response?.data?.error || 'Failed to create person' });
    }
  };

  // Form handlers for credits
  const handleAddDirector = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (person && !formData.directors.find(d => d.personId === personId)) {
      setFormData({
        ...formData,
        directors: [...formData.directors, { personId: person.id, name: person.name }]
      });
    }
  };

  const handleRemoveDirector = (personId: string) => {
    setFormData({
      ...formData,
      directors: formData.directors.filter(d => d.personId !== personId)
    });
  };

  const handleAddProducer = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (person && !formData.producers.find(p => p.personId === personId)) {
      setFormData({
        ...formData,
        producers: [...formData.producers, { personId: person.id, name: person.name }]
      });
    }
  };

  const handleRemoveProducer = (personId: string) => {
    setFormData({
      ...formData,
      producers: formData.producers.filter(p => p.personId !== personId)
    });
  };

  const handleAddCast = (personId: string, characterName: string) => {
    const person = people.find(p => p.id === personId);
    if (person && personId && characterName) {
      setFormData({
        ...formData,
        cast: [...formData.cast, { personId: person.id, name: person.name, characterName }]
      });
    }
  };

  const handleRemoveCast = (index: number) => {
    setFormData({
      ...formData,
      cast: formData.cast.filter((_, i) => i !== index)
    });
  };

  // TMDB handlers
  const handleSearchTMDB = async (page: number = 1) => {
    if (!tmdbSearchQuery.trim()) {
      setTmdbMovies([]);
      return;
    }

    setTmdbLoading(true);
    try {
      const response = await tmdbAPI.searchMovies(tmdbSearchQuery, page);
      setTmdbMovies(response.data.movies || []);
      setTmdbCurrentPage(response.data.pagination?.page || 1);
      setTmdbTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      const error = err as APIError;
      setErrorModal({ show: true, message: error.response?.data?.error || 'Failed to search TMDB' });
    } finally {
      setTmdbLoading(false);
    }
  };

  const handleLoadPopular = async (page: number = 1) => {
    setTmdbLoading(true);
    try {
      const response = await tmdbAPI.getPopular(page);
      setTmdbMovies(response.data.movies || []);
      setTmdbSearchQuery('');
      setTmdbCurrentPage(response.data.pagination?.page || 1);
      setTmdbTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      const error = err as APIError;
      setErrorModal({ show: true, message: error.response?.data?.error || 'Failed to load movies' });
    } finally {
      setTmdbLoading(false);
    }
  };

  const handleImportMovie = async (tmdbId: number, title: string) => {
    setImportingMovies(prev => new Set(prev).add(tmdbId));
    try {
      await tmdbAPI.importMovie(tmdbId);
      setSuccessModal({ show: true, message: `Movie "${title}" imported successfully!` });
      fetchMovies();
      // Remove from TMDB list
      setTmdbMovies(prev => prev.filter(m => m.tmdbId !== tmdbId));
    } catch (err) {
      const error = err as APIError;
      const errorMessage = error.response?.data?.error || 'Failed to import movie';
      setErrorModal({ show: true, message: errorMessage });
    } finally {
      setImportingMovies(prev => {
        const newSet = new Set(prev);
        newSet.delete(tmdbId);
        return newSet;
      });
    }
  };

  const handleBulkImport = async () => {
    setBulkImporting(true);
    try {
      const response = await tmdbAPI.bulkImport();
      setSuccessModal({
        show: true,
        message: `Bulk import completed! Imported: ${response.data.imported}, Skipped: ${response.data.skipped}`
      });
      fetchMovies();
      handleLoadPopular(); // Refresh the list
    } catch (err) {
      const error = err as APIError;
      setErrorModal({ show: true, message: error.response?.data?.error || 'Failed to bulk import' });
    } finally {
      setBulkImporting(false);
    }
  };

  if (moviesLoading || usersLoading) return <LoadingSpinner />;

  // Pagination for movies
  const indexOfLastMovie = currentMoviePage * moviesPerPage;
  const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
  const currentMovies = movies.slice(indexOfFirstMovie, indexOfLastMovie);
  const totalMoviePages = Math.ceil(movies.length / moviesPerPage);

  // Pagination for users
  const indexOfLastUser = currentUserPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalUserPages = Math.ceil(users.length / usersPerPage);

  return (
    <div>
      <h1 className="mb-4">Admin Dashboard</h1>

      {/* Stats Cards */}
      <Row className="mb-5">
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Total Movies</Card.Title>
              <h2>{movies.length}</h2>
              <div className="mt-3 d-flex gap-2">
                <Button variant="primary" onClick={openCreateModal}>Add Movie Manually</Button>
                <Button variant="success" onClick={() => setShowTMDBModal(true)}>Import from TMDB</Button>
              </div>
            </Card.Body>
          </Card>

          {/* Movies Table */}
          <Card>
            <Card.Body>
              <h4 className="mb-3">Manage Movies</h4>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Year</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMovies.map((movie) => (
                    <tr key={movie.id}>
                      <td>{movie.title}</td>
                      <td>{movie.releaseYear}</td>
                      <td>
                        <Button variant="warning" size="sm" onClick={() => openEditModal(movie)} className="me-2">
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setDeleteMovieModal({ show: true, movieId: movie.id, movieTitle: movie.title })}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalMoviePages > 1 && (
                <Pagination className="justify-content-center">
                  <Pagination.Prev
                    onClick={() => setCurrentMoviePage(prev => Math.max(prev - 1, 1))}
                    disabled={currentMoviePage === 1}
                  />
                  {[...Array(totalMoviePages)].map((_, idx) => (
                    <Pagination.Item
                      key={idx + 1}
                      active={idx + 1 === currentMoviePage}
                      onClick={() => setCurrentMoviePage(idx + 1)}
                    >
                      {idx + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => setCurrentMoviePage(prev => Math.min(prev + 1, totalMoviePages))}
                    disabled={currentMoviePage === totalMoviePages}
                  />
                </Pagination>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Total Users</Card.Title>
              <h2>{users.length}</h2>
            </Card.Body>
          </Card>

          {/* Users Table */}
          <Card>
            <Card.Body>
              <h4 className="mb-3">Manage Users</h4>
              {usersError && (
                <MessageModal
                  show={true}
                  title="Error"
                  message={usersError}
                  variant="danger"
                  onClose={() => window.location.reload()}
                />
              )}
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user: User) => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <Badge bg={user.role === 'ADMIN' ? 'danger' : 'primary'}>{user.role}</Badge>
                      </td>
                      <td>
                        <Badge bg={user.isBlocked ? 'danger' : 'success'}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant={user.isBlocked ? 'success' : 'warning'}
                          size="sm"
                          onClick={() => handleBlockUnblock(user.id, user.isBlocked, user.username)}
                          className="me-2"
                        >
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </Button>
                        {user.role !== 'ADMIN' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteUserModal({ show: true, userId: user.id, username: user.username })}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {totalUserPages > 1 && (
                <Pagination className="justify-content-center">
                  <Pagination.Prev
                    onClick={() => setCurrentUserPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentUserPage === 1}
                  />
                  {[...Array(totalUserPages)].map((_, idx) => (
                    <Pagination.Item
                      key={idx + 1}
                      active={idx + 1 === currentUserPage}
                      onClick={() => setCurrentUserPage(idx + 1)}
                    >
                      {idx + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => setCurrentUserPage(prev => Math.min(prev + 1, totalUserPages))}
                    disabled={currentUserPage === totalUserPages}
                  />
                </Pagination>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Genre and People Management */}
      <Row className="mb-4">
        <Col md={6}>
          <Card>
            <Card.Body>
              <h4 className="mb-3">Manage Genres</h4>
              <Form.Group className="mb-3">
                <Form.Label>Create New Genre</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="text"
                    placeholder="Genre name"
                    value={newGenreName}
                    onChange={(e) => setNewGenreName(e.target.value)}
                  />
                  <Button variant="primary" onClick={handleCreateGenre}>
                    Create
                  </Button>
                </div>
              </Form.Group>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {genres.map(genre => (
                  <Badge key={genre.id} bg="secondary" className="me-1 mb-1">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <Card.Body>
              <h4 className="mb-3">Manage People</h4>
              <Form.Group className="mb-3">
                <Form.Label>Create New Person</Form.Label>
                <div className="d-flex gap-2 mb-2">
                  <Form.Control
                    type="text"
                    placeholder="Person name"
                    value={newPersonName}
                    onChange={(e) => setNewPersonName(e.target.value)}
                  />
                  <Form.Select
                    value={newPersonType}
                    onChange={(e) => setNewPersonType(e.target.value as 'ACTOR' | 'DIRECTOR' | 'PRODUCER')}
                    style={{ width: '150px' }}
                  >
                    <option value="ACTOR">Actor</option>
                    <option value="DIRECTOR">Director</option>
                    <option value="PRODUCER">Producer</option>
                  </Form.Select>
                  <Button variant="primary" onClick={handleCreatePerson}>
                    Create
                  </Button>
                </div>
              </Form.Group>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {people.map(person => (
                  <Badge
                    key={person.id}
                    bg={person.type === 'DIRECTOR' ? 'info' : person.type === 'PRODUCER' ? 'warning' : 'success'}
                    className="me-1 mb-1"
                  >
                    {person.name} ({person.type})
                  </Badge>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Movie Form Modal */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingMovie ? 'Edit Movie' : 'Add Movie'}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <Form onSubmit={handleMovieSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Release Year</Form.Label>
              <Form.Control
                type="number"
                value={formData.releaseYear}
                onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value ? Number(e.target.value) : '' })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Plot</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.plot}
                onChange={(e) => setFormData({ ...formData, plot: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Poster URL</Form.Label>
              <Form.Control
                type="url"
                value={formData.posterUrl}
                onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
              />
            </Form.Group>

            {/* Genres */}
            <Form.Group className="mb-3">
              <Form.Label>Genres</Form.Label>
              <div className="mb-2">
                {formData.selectedGenres.map(genreId => {
                  const genre = genres.find(g => g.id === genreId);
                  return genre ? (
                    <Badge key={genreId} bg="secondary" className="me-1">
                      {genre.name}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.6rem' }}
                        onClick={() => setFormData({
                          ...formData,
                          selectedGenres: formData.selectedGenres.filter(id => id !== genreId)
                        })}
                      />
                    </Badge>
                  ) : null;
                })}
              </div>
              <Form.Select
                onChange={(e) => {
                  if (e.target.value && !formData.selectedGenres.includes(e.target.value)) {
                    setFormData({
                      ...formData,
                      selectedGenres: [...formData.selectedGenres, e.target.value]
                    });
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Select a genre...</option>
                {genres.map(genre => (
                  <option key={genre.id} value={genre.id}>{genre.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Directors */}
            <Form.Group className="mb-3">
              <Form.Label>Directors</Form.Label>
              <div className="mb-2">
                {formData.directors.map(director => (
                  <Badge key={director.personId} bg="info" className="me-1">
                    {director.name}
                    <button
                      type="button"
                      className="btn-close btn-close-white ms-1"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => handleRemoveDirector(director.personId)}
                    />
                  </Badge>
                ))}
              </div>
              <Form.Select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddDirector(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Add a director...</option>
                {people.filter(p => p.type === 'DIRECTOR').map(person => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Producers */}
            <Form.Group className="mb-3">
              <Form.Label>Producers</Form.Label>
              <div className="mb-2">
                {formData.producers.map(producer => (
                  <Badge key={producer.personId} bg="warning" className="me-1">
                    {producer.name}
                    <button
                      type="button"
                      className="btn-close ms-1"
                      style={{ fontSize: '0.6rem' }}
                      onClick={() => handleRemoveProducer(producer.personId)}
                    />
                  </Badge>
                ))}
              </div>
              <Form.Select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddProducer(e.target.value);
                    e.target.value = '';
                  }
                }}
              >
                <option value="">Add a producer...</option>
                {people.filter(p => p.type === 'PRODUCER').map(person => (
                  <option key={person.id} value={person.id}>{person.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Cast */}
            <Form.Group className="mb-3">
              <Form.Label>Cast</Form.Label>
              <div className="mb-2">
                {formData.cast.map((actor, index) => (
                  <div key={index} className="d-flex align-items-center mb-1">
                    <Badge bg="success" className="me-2">
                      {actor.name} as {actor.characterName}
                      <button
                        type="button"
                        className="btn-close btn-close-white ms-1"
                        style={{ fontSize: '0.6rem' }}
                        onClick={() => handleRemoveCast(index)}
                      />
                    </Badge>
                  </div>
                ))}
              </div>
              <Row>
                <Col md={6}>
                  <Form.Select id="castPersonSelect">
                    <option value="">Select actor...</option>
                    {people.filter(p => p.type === 'ACTOR').map(person => (
                      <option key={person.id} value={person.id}>{person.name}</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Form.Control id="castCharacterInput" placeholder="Character name" />
                </Col>
                <Col md={2}>
                  <Button
                    variant="outline-success"
                    size="sm"
                    onClick={() => {
                      const personSelect = document.getElementById('castPersonSelect') as HTMLSelectElement;
                      const characterInput = document.getElementById('castCharacterInput') as HTMLInputElement;
                      if (personSelect.value && characterInput.value) {
                        handleAddCast(personSelect.value, characterInput.value);
                        personSelect.value = '';
                        characterInput.value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </Col>
              </Row>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowFormModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Save
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* TMDB Import Modal */}
      <Modal show={showTMDBModal} onHide={() => setShowTMDBModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Import Movies from TMDB</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="mb-4">
            <Row>
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Search TMDB Movies</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter movie title..."
                    value={tmdbSearchQuery}
                    onChange={(e) => setTmdbSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchTMDB()}
                  />
                </Form.Group>
              </Col>
              <Col md={4} className="d-flex align-items-end gap-2">
                <Button variant="primary" onClick={handleSearchTMDB} disabled={tmdbLoading}>
                  {tmdbLoading ? <Spinner animation="border" size="sm" /> : 'Search'}
                </Button>
                <Button variant="info" onClick={handleLoadPopular} disabled={tmdbLoading}>
                  Browse Movies
                </Button>
              </Col>
            </Row>
            <div className="mt-3">
              <Button
                variant="success"
                onClick={handleBulkImport}
                disabled={bulkImporting}
              >
                {bulkImporting ? <><Spinner animation="border" size="sm" className="me-2" />Importing...</> : 'Bulk Import'}
              </Button>
              <Alert variant="info" className="mt-2 mb-0">
                Bulk import will automatically import TMDB movies, skipping duplicates.
              </Alert>
            </div>
          </div>

          {tmdbLoading && (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <p className="mt-2">Searching TMDB...</p>
            </div>
          )}

          {!tmdbLoading && tmdbMovies.length === 0 && (
            <Alert variant="secondary">
              No movies found. Try searching or browsing movies.
            </Alert>
          )}

          {!tmdbLoading && tmdbMovies.length > 0 && (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Poster</th>
                  <th>Title</th>
                  <th>Year</th>
                  <th>Rating</th>
                  <th style={{ width: '120px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tmdbMovies.map((movie) => (
                  <tr key={movie.tmdbId}>
                    <td>
                      {movie.posterUrl && (
                        <img src={movie.posterUrl} alt={movie.title} style={{ width: '40px', height: '60px', objectFit: 'cover' }} />
                      )}
                    </td>
                    <td>
                      <strong>{movie.title}</strong>
                      {movie.plot && (
                        <div className="text-muted small" style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {movie.plot}
                        </div>
                      )}
                    </td>
                    <td>{movie.releaseYear}</td>
                    <td>
                      {movie.rating ? (
                        <Badge bg="warning" text="dark">{movie.rating.toFixed(1)}/10</Badge>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleImportMovie(movie.tmdbId, movie.title)}
                        disabled={importingMovies.has(movie.tmdbId)}
                      >
                        {importingMovies.has(movie.tmdbId) ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          'Import'
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {!tmdbLoading && tmdbMovies.length > 0 && tmdbTotalPages > 1 && (
            <Pagination className="justify-content-center mt-3">
              <Pagination.First
                onClick={() => tmdbSearchQuery ? handleSearchTMDB(1) : handleLoadPopular(1)}
                disabled={tmdbCurrentPage === 1}
              />
              <Pagination.Prev
                onClick={() => tmdbSearchQuery ? handleSearchTMDB(tmdbCurrentPage - 1) : handleLoadPopular(tmdbCurrentPage - 1)}
                disabled={tmdbCurrentPage === 1}
              />

              {/* Show current page and nearby pages */}
              {tmdbCurrentPage > 2 && <Pagination.Ellipsis disabled />}

              {[...Array(Math.min(5, tmdbTotalPages))].map((_, idx) => {
                let pageNum;
                if (tmdbTotalPages <= 5) {
                  pageNum = idx + 1;
                } else if (tmdbCurrentPage <= 3) {
                  pageNum = idx + 1;
                } else if (tmdbCurrentPage >= tmdbTotalPages - 2) {
                  pageNum = tmdbTotalPages - 4 + idx;
                } else {
                  pageNum = tmdbCurrentPage - 2 + idx;
                }

                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === tmdbCurrentPage}
                    onClick={() => tmdbSearchQuery ? handleSearchTMDB(pageNum) : handleLoadPopular(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              })}

              {tmdbCurrentPage < tmdbTotalPages - 2 && <Pagination.Ellipsis disabled />}

              <Pagination.Next
                onClick={() => tmdbSearchQuery ? handleSearchTMDB(tmdbCurrentPage + 1) : handleLoadPopular(tmdbCurrentPage + 1)}
                disabled={tmdbCurrentPage === tmdbTotalPages}
              />
              <Pagination.Last
                onClick={() => tmdbSearchQuery ? handleSearchTMDB(tmdbTotalPages) : handleLoadPopular(tmdbTotalPages)}
                disabled={tmdbCurrentPage === tmdbTotalPages}
              />
            </Pagination>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="d-flex justify-content-between w-100 align-items-center">
            <span className="text-muted">
              {tmdbMovies.length > 0 && `Page ${tmdbCurrentPage} of ${tmdbTotalPages}`}
            </span>
            <Button variant="secondary" onClick={() => setShowTMDBModal(false)}>
              Close
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      {/* Delete Movie Confirmation Modal */}
      <ConfirmModal
        show={deleteMovieModal.show}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${deleteMovieModal.movieTitle}"? This action cannot be undone.`}
        onConfirm={confirmDeleteMovie}
        onCancel={() => setDeleteMovieModal({ show: false, movieId: '', movieTitle: '' })}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        show={deleteUserModal.show}
        title="Confirm Delete"
        message={`Are you sure you want to delete user "${deleteUserModal.username}"? This action cannot be undone.`}
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteUserModal({ show: false, userId: '', username: '' })}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

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
