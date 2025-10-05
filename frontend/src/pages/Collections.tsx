import { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Alert, Badge, ListGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { collectionAPI } from '../api';

export default function Collections() {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await collectionAPI.getMyCollections();
      setCollections(response.data.collections);
    } catch (err) {
      setError('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await collectionAPI.createCollection({
        name: newCollectionName,
        description: newCollectionDesc,
      });
      setShowModal(false);
      setNewCollectionName('');
      setNewCollectionDesc('');
      fetchCollections();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create collection');
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Collections</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Create Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <Alert variant="info">You don't have any collections yet. Create one to organize your movies!</Alert>
      ) : (
        collections.map((collection) => (
          <Card key={collection.id} className="mb-3">
            <Card.Body>
              <Card.Title>{collection.name}</Card.Title>
              {collection.description && <Card.Text>{collection.description}</Card.Text>}
              <Badge bg="secondary">{collection.movies.length} movies</Badge>
              <ListGroup variant="flush" className="mt-2">
                {collection.movies.map((cm: any) => (
                  <ListGroup.Item key={cm.id}>
                    <Link to={`/movies/${cm.movie.id}`}>{cm.movie.title}</Link> ({cm.movie.releaseYear})
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        ))
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateCollection}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
              />
            </Form.Group>
            <Button variant="primary" type="submit">
              Create
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
