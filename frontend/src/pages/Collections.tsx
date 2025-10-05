import { useState } from 'react';
import { Card, Button, Modal, Form, Badge, ListGroup, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useCollections } from '../hooks';
import { LoadingSpinner, MessageModal } from '../components/common';

export default function Collections() {
  const { collections, loading, error, createCollection } = useCollections();
  const [showModal, setShowModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [errorModal, setErrorModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });
  const [successModal, setSuccessModal] = useState<{ show: boolean; message: string }>({
    show: false,
    message: ''
  });

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCollection({
        name: newCollectionName,
        description: newCollectionDesc,
      });
      setShowModal(false);
      setNewCollectionName('');
      setNewCollectionDesc('');
      setSuccessModal({ show: true, message: `Collection "${newCollectionName}" created successfully!` });
    } catch (err: any) {
      setErrorModal({ show: true, message: err.message });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Collections</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Create Collection
        </Button>
      </div>

      {error && (
        <MessageModal
          show={true}
          title="Error"
          message={error}
          variant="danger"
          onClose={() => window.location.reload()}
        />
      )}

      {collections.length === 0 ? (
        <Alert variant="info">
          You don't have any collections yet. Create one to organize your movies!
        </Alert>
      ) : (
        collections.map((collection) => (
          <Card key={collection.id} className="mb-3">
            <Card.Body>
              <Card.Title>{collection.name}</Card.Title>
              {collection.description && <Card.Text>{collection.description}</Card.Text>}
              <Badge bg="secondary">{collection.movies.length} movies</Badge>
              <ListGroup variant="flush" className="mt-2">
                {collection.movies.map((cm) => (
                  <ListGroup.Item key={cm.id}>
                    <Link to={`/movies/${cm.movie.id}`}>{cm.movie.title}</Link> ({cm.movie.releaseYear})
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        ))
      )}

      {/* Create Collection Modal */}
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
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                Create
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

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
