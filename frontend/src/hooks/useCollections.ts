import { useState, useEffect, useCallback } from 'react';
import { collectionAPI } from '../services/api';
import { Collection, CreateCollectionInput } from '../types';

interface UseCollectionsResult {
  collections: Collection[];
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
  createCollection: (data: CreateCollectionInput) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addMovieToCollection: (collectionId: string, movieId: string) => Promise<void>;
  removeMovieFromCollection: (collectionId: string, movieId: string) => Promise<void>;
}

export const useCollections = (): UseCollectionsResult => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await collectionAPI.getMyCollections();
      setCollections(response.data.collections);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  }, []);

  const createCollection = async (data: CreateCollectionInput) => {
    try {
      await collectionAPI.createCollection(data);
      await fetchCollections();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to create collection');
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      await collectionAPI.deleteCollection(id);
      await fetchCollections();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to delete collection');
    }
  };

  const addMovieToCollection = async (collectionId: string, movieId: string) => {
    try {
      await collectionAPI.addMovieToCollection(collectionId, movieId);
      await fetchCollections();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to add movie to collection');
    }
  };

  const removeMovieFromCollection = async (collectionId: string, movieId: string) => {
    try {
      await collectionAPI.removeMovieFromCollection(collectionId, movieId);
      await fetchCollections();
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Failed to remove movie from collection');
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  return {
    collections,
    loading,
    error,
    refetch: fetchCollections,
    createCollection,
    deleteCollection,
    addMovieToCollection,
    removeMovieFromCollection
  };
};
