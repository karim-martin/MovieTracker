import { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { movieAPI } from '../api';

export default function AdminMovies() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [formData, setFormData] = useState({ title: '', releaseYear: '', plot: '', posterUrl: '' });

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const response = await movieAPI.getAllMovies();
      setMovies(response.data.movies);
    } catch (err) {
      setError('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMovie) {
        await movieAPI.updateMovie(editingMovie.id, formData);
      } else {
        await movieAPI.createMovie(formData);
      }
      setShowModal(false);
      setEditingMovie(null);
      setFormData({ title: '', releaseYear: '', plot: '', posterUrl: '' });
      fetchMovies();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save movie');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this movie?')) {
      try {
        await movieAPI.deleteMovie(id);
        fetchMovies();
      } catch (err) {
        setError('Failed to delete movie');
      }
    }
  };

  const openEditModal = (movie: any) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      releaseYear: movie.releaseYear,
      plot: movie.plot || '',
      posterUrl: movie.posterUrl || '',
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingMovie(null);
    setFormData({ title: '', releaseYear: '', plot: '', posterUrl: '' });
    setShowModal(true);
  };

  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Manage Movies</h1>
        <Button variant="primary" onClick={openCreateModal}>Add Movie</Button>
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
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
                <Button variant="warning" size="sm" onClick={() => openEditModal(movie)} className="me-2">Edit</Button>
                <Button variant="danger" size="sm" onClick={() => handleDelete(movie.id)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
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
                onChange={(e) => setFormData({ ...formData, releaseYear: e.target.value })}
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
            <Button variant="primary" type="submit">Save</Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
