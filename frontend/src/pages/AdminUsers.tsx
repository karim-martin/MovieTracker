import { useState, useEffect } from 'react';
import { Table, Button, Badge, Alert } from 'react-bootstrap';
import { userAPI } from '../api';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data.users);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUnblock = async (userId: string, isBlocked: boolean) => {
    try {
      if (isBlocked) {
        await userAPI.unblockUser(userId);
      } else {
        await userAPI.blockUser(userId);
      }
      fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.deleteUser(userId);
        fetchUsers();
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div>
      <h1 className="mb-4">Manage Users</h1>
      {error && <Alert variant="danger">{error}</Alert>}
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
          {users.map((user) => (
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
                  onClick={() => handleBlockUnblock(user.id, user.isBlocked)}
                  className="me-2"
                >
                  {user.isBlocked ? 'Unblock' : 'Block'}
                </Button>
                {user.role !== 'ADMIN' && (
                  <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
                    Delete
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
