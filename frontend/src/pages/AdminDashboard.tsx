import { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Button, Modal, Form, Badge, Pagination } from 'react-bootstrap';
import { movieAPI } from '../services/api';
import { useUsers } from '../hooks';
import { Movie, APIError, User } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { MessageModal } from '../components/MessageModal';

interface MovieFormData {
  title: string;
  releaseYear: number | '';
  plot: string;
  posterUrl: string;
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
    posterUrl: ''
  });
  const [currentMoviePage, setCurrentMoviePage] = useState(1);
  const moviesPerPage = 10;

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

  // Fetch movies on mount
  useEffect(() => {
    fetchMovies();
  }, []);

  // Movie handlers
  const handleMovieSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const movieData = {
        title: formData.title,
        releaseYear: Number(formData.releaseYear),
        plot: formData.plot,
        posterUrl: formData.posterUrl
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
      setFormData({ title: '', releaseYear: '', plot: '', posterUrl: '' });
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
    setFormData({
      title: movie.title,
      releaseYear: movie.releaseYear,
      plot: movie.plot || '',
      posterUrl: movie.posterUrl || '',
    });
    setShowFormModal(true);
  };

  const openCreateModal = () => {
    setEditingMovie(null);
    setFormData({ title: '', releaseYear: '', plot: '', posterUrl: '' });
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
              <div className="mt-3">
                <Button variant="primary" onClick={openCreateModal}>Add Movie</Button>
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

      {/* Movie Form Modal */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingMovie ? 'Edit Movie' : 'Add Movie'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
