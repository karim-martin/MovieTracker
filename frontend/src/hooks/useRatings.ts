import { useState, useEffect, useCallback } from 'react';
import { ratingAPI } from '../services/api';
import { UserRating, CreateRatingInput } from '../types';

interface UseRatingsResult {
  ratings: UserRating[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  createRating: (data: CreateRatingInput) => Promise<void>;
  updateRating: (id: string, data: Partial<CreateRatingInput>) => Promise<void>;
  deleteRating: (id: string) => Promise<void>;
}

export const useRatings = (): UseRatingsResult => {
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRatings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ratingAPI.getMyRatings();
      setRatings(response.data.ratings);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load ratings');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRating = async (data: CreateRatingInput) => {
    try {
      await ratingAPI.createRating(data);
      await fetchRatings();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to create rating');
    }
  };

  const updateRating = async (id: string, data: Partial<CreateRatingInput>) => {
    try {
      await ratingAPI.updateRating(id, data);
      await fetchRatings();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to update rating');
    }
  };

  const deleteRating = async (id: string) => {
    try {
      await ratingAPI.deleteRating(id);
      await fetchRatings();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to delete rating');
    }
  };

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  return {
    ratings,
    loading,
    error,
    refetch: fetchRatings,
    createRating,
    updateRating,
    deleteRating
  };
};
