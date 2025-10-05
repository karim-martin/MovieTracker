import { useState } from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { useUsers } from '../hooks';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ConfirmModal } from '../components/ConfirmModal';
import { MessageModal } from '../components/MessageModal';
import { User } from '../types';

export default function AdminUsers() {
  const { users, loading, error, blockUser, unblockUser, deleteUser } = useUsers();
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; userId: string; username: string }>({
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

  const handleBlockUnblock = async (userId: string, isBlocked: boolean, username: string) => {
    try {
      if (isBlocked) {
        await unblockUser(userId);
        setSuccessModal({ show: true, message: `User "${username}" has been unblocked successfully.` });
      } else {
        await blockUser(userId);
        setSuccessModal({ show: true, message: `User "${username}" has been blocked successfully.` });
      }
    } catch (err: any) {
      setErrorModal({ show: true, message: err.message });
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(deleteModal.userId);
      setDeleteModal({ show: false, userId: '', username: '' });
      setSuccessModal({ show: true, message: `User "${deleteModal.username}" has been deleted successfully.` });
    } catch (err: any) {
      setDeleteModal({ show: false, userId: '', username: '' });
      setErrorModal({ show: true, message: err.message });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="mb-4">Manage Users</h1>
      {error && (
        <MessageModal
          show={true}
          title="Error"
          message={error}
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
          {users.map((user: User) => (
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
                    onClick={() => setDeleteModal({ show: true, userId: user.id, username: user.username })}
                  >
                    Delete
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <ConfirmModal
        show={deleteModal.show}
        title="Confirm Delete"
        message={`Are you sure you want to delete user "${deleteModal.username}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ show: false, userId: '', username: '' })}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <MessageModal
        show={errorModal.show}
        title="Error"
        message={errorModal.message}
        variant="danger"
        onClose={() => setErrorModal({ show: false, message: '' })}
      />

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
