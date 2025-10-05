import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form } from 'react-bootstrap';
import { movieAPI } from '../services/api';
import { Movie } from '../types';
import { LoadingSpinner, ConfirmModal, MessageModal } from '../components/common';

interface MovieFormData {
  title: string;
  releaseYear: number | '';
  plot: string;
  posterUrl: string;
}

export default function AdminMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<MovieFormData>({
    title: '',
    releaseYear: '',
    plot: '',
    posterUrl: ''
  });
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; movieId: string; movieTitle: string }>({
    show: false,
    movieId: '',
    movieTitle: ''
  });
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });
  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await movieAPI.getAllMovies();
      setMovies(response.data.movies);
    } catch (err: any) {
      setErrorModal({ show: true, message: err.message || 'Failed to load movies' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setErrorModal({ show: true, message: err.response?.data?.error || 'Failed to save movie' });
    }
  };

  const confirmDelete = async () => {
    try {
      await movieAPI.deleteMovie(deleteModal.movieId);
      setDeleteModal({ show: false, movieId: '', movieTitle: '' });
      setSuccessModal({ show: true, message: `Movie "${deleteModal.movieTitle}" deleted successfully!` });
      fetchMovies();
    } catch (err: any) {
      setDeleteModal({ show: false, movieId: '', movieTitle: '' });
      setErrorModal({ show: true, message: err.message || 'Failed to delete movie' });
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

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Manage Movies</h1>
        <Button variant="primary" onClick={openCreateModal}>Add Movie</Button>
      </div>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Title</th>
            <th>Year</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {movies.map((movie) => (
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
                  onClick={() => setDeleteModal({ show: true, movieId: movie.id, movieTitle: movie.title })}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Movie Form Modal */}
      <Modal show={showFormModal} onHide={() => setShowFormModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingMovie ? 'Edit Movie' : 'Add Movie'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={deleteModal.show}
        title="Confirm Delete"
        message={`Are you sure you want to delete "${deleteModal.movieTitle}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ show: false, movieId: '', movieTitle: '' })}
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
