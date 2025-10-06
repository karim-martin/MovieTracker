import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../services/api';
import { User, APIError } from '../types';

interface UseUsersResult {
  users: User[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  blockUser: (id: string) => Promise<void>;
  unblockUser: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

export const useUsers = (): UseUsersResult => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userAPI.getAllUsers();
      setUsers(response.data.users);
    } catch (err) {
      const error = err as APIError;
      setError(error.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  const blockUser = async (id: string) => {
    try {
      await userAPI.blockUser(id);
      await fetchUsers();
    } catch (err) {
      const error = err as APIError;
      throw new Error(error.response?.data?.error || 'Failed to block user');
    }
  };

  const unblockUser = async (id: string) => {
    try {
      await userAPI.unblockUser(id);
      await fetchUsers();
    } catch (err) {
      const error = err as APIError;
      throw new Error(error.response?.data?.error || 'Failed to unblock user');
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await userAPI.deleteUser(id);
      await fetchUsers();
    } catch (err) {
      const error = err as APIError;
      throw new Error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    blockUser,
    unblockUser,
    deleteUser
  };
};
