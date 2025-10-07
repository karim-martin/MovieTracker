import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../src/pages/AdminDashboard';
import * as hooks from '../src/hooks';
import * as api from '../src/services/api';

vi.mock('../src/hooks', () => ({
  useUsers: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  movieAPI: {
    getAllMovies: vi.fn(),
    createMovie: vi.fn(),
    updateMovie: vi.fn(),
    deleteMovie: vi.fn(),
  },
  genreAPI: {
    getAllGenres: vi.fn(),
    createGenre: vi.fn(),
  },
  personAPI: {
    getAllPeople: vi.fn(),
    createPerson: vi.fn(),
  },
  tmdbAPI: {
    searchMovies: vi.fn(),
    getPopular: vi.fn(),
    importMovie: vi.fn(),
    bulkImport: vi.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockResponse = any;

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMovies = [
    {
      id: '1',
      title: 'Test Movie 1',
      releaseYear: 2023,
      plot: 'Test plot 1',
      posterUrl: 'https://example.com/poster1.jpg',
      genres: [],
      credits: [],
    },
    {
      id: '2',
      title: 'Test Movie 2',
      releaseYear: 2024,
      plot: 'Test plot 2',
      posterUrl: 'https://example.com/poster2.jpg',
      genres: [],
      credits: [],
    },
  ];

  const mockUsers = [
    {
      id: '1',
      email: 'user1@example.com',
      username: 'user1',
      role: 'USER' as const,
      isBlocked: false,
    },
    {
      id: '2',
      email: 'user2@example.com',
      username: 'user2',
      role: 'USER' as const,
      isBlocked: false,
    },
  ];

  const mockGenres = [
    { id: '1', name: 'Action' },
    { id: '2', name: 'Drama' },
  ];

  const mockPeople = [
    { id: '1', name: 'Actor 1', type: 'ACTOR' },
    { id: '2', name: 'Director 1', type: 'DIRECTOR' },
  ];

  it('renders page title', async () => {
    vi.mocked(api.movieAPI.getAllMovies).mockResolvedValue({ data: { movies: [] } } as MockResponse);
    vi.mocked(api.genreAPI.getAllGenres).mockResolvedValue({ data: { genres: [] } } as MockResponse);
    vi.mocked(api.personAPI.getAllPeople).mockResolvedValue({ data: { people: [] } } as MockResponse);
    vi.mocked(hooks.useUsers).mockReturnValue({
      users: [],
      loading: false,
      error: '',
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      deleteUser: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });

  it('displays total movies count', async () => {
    vi.mocked(api.movieAPI.getAllMovies).mockResolvedValue({ data: { movies: mockMovies } } as MockResponse);
    vi.mocked(api.genreAPI.getAllGenres).mockResolvedValue({ data: { genres: [] } } as MockResponse);
    vi.mocked(api.personAPI.getAllPeople).mockResolvedValue({ data: { people: [] } } as MockResponse);
    vi.mocked(hooks.useUsers).mockReturnValue({
      users: [],
      loading: false,
      error: '',
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      deleteUser: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Movies')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('displays total users count', async () => {
    vi.mocked(api.movieAPI.getAllMovies).mockResolvedValue({ data: { movies: [] } } as MockResponse);
    vi.mocked(api.genreAPI.getAllGenres).mockResolvedValue({ data: { genres: [] } } as MockResponse);
    vi.mocked(api.personAPI.getAllPeople).mockResolvedValue({ data: { people: [] } } as MockResponse);
    vi.mocked(hooks.useUsers).mockReturnValue({
      users: mockUsers,
      loading: false,
      error: '',
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      deleteUser: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('displays movies in table', async () => {
    vi.mocked(api.movieAPI.getAllMovies).mockResolvedValue({ data: { movies: mockMovies } } as MockResponse);
    vi.mocked(api.genreAPI.getAllGenres).mockResolvedValue({ data: { genres: [] } } as MockResponse);
    vi.mocked(api.personAPI.getAllPeople).mockResolvedValue({ data: { people: [] } } as MockResponse);
    vi.mocked(hooks.useUsers).mockReturnValue({
      users: [],
      loading: false,
      error: '',
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      deleteUser: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
      expect(screen.getByText('Test Movie 2')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
      expect(screen.getByText('2024')).toBeInTheDocument();
    });
  });

  it('displays users in table', async () => {
    vi.mocked(api.movieAPI.getAllMovies).mockResolvedValue({ data: { movies: [] } } as MockResponse);
    vi.mocked(api.genreAPI.getAllGenres).mockResolvedValue({ data: { genres: [] } } as MockResponse);
    vi.mocked(api.personAPI.getAllPeople).mockResolvedValue({ data: { people: [] } } as MockResponse);
    vi.mocked(hooks.useUsers).mockReturnValue({
      users: mockUsers,
      loading: false,
      error: '',
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      deleteUser: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('user2')).toBeInTheDocument();
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });
  });

  it('displays action buttons for movies', async () => {
    vi.mocked(api.movieAPI.getAllMovies).mockResolvedValue({ data: { movies: mockMovies } } as MockResponse);
    vi.mocked(api.genreAPI.getAllGenres).mockResolvedValue({ data: { genres: [] } } as MockResponse);
    vi.mocked(api.personAPI.getAllPeople).mockResolvedValue({ data: { people: [] } } as MockResponse);
    vi.mocked(hooks.useUsers).mockReturnValue({
      users: [],
      loading: false,
      error: '',
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      deleteUser: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const editButtons = screen.getAllByText('Edit');
      const deleteButtons = screen.getAllByText('Delete');
      expect(editButtons.length).toBeGreaterThan(0);
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  it('displays add movie button', async () => {
    vi.mocked(api.movieAPI.getAllMovies).mockResolvedValue({ data: { movies: [] } } as MockResponse);
    vi.mocked(api.genreAPI.getAllGenres).mockResolvedValue({ data: { genres: [] } } as MockResponse);
    vi.mocked(api.personAPI.getAllPeople).mockResolvedValue({ data: { people: [] } } as MockResponse);
    vi.mocked(hooks.useUsers).mockReturnValue({
      users: [],
      loading: false,
      error: '',
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      deleteUser: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Add Movie Manually')).toBeInTheDocument();
      expect(screen.getByText('Import from TMDB')).toBeInTheDocument();
    });
  });

  it('displays genres section', async () => {
    vi.mocked(api.movieAPI.getAllMovies).mockResolvedValue({ data: { movies: [] } } as MockResponse);
    vi.mocked(api.genreAPI.getAllGenres).mockResolvedValue({ data: { genres: mockGenres } } as MockResponse);
    vi.mocked(api.personAPI.getAllPeople).mockResolvedValue({ data: { people: [] } } as MockResponse);
    vi.mocked(hooks.useUsers).mockReturnValue({
      users: [],
      loading: false,
      error: '',
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      deleteUser: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Genres')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
      expect(screen.getByText('Drama')).toBeInTheDocument();
    });
  });

  it('displays people section', async () => {
    vi.mocked(api.movieAPI.getAllMovies).mockResolvedValue({ data: { movies: [] } } as MockResponse);
    vi.mocked(api.genreAPI.getAllGenres).mockResolvedValue({ data: { genres: [] } } as MockResponse);
    vi.mocked(api.personAPI.getAllPeople).mockResolvedValue({ data: { people: mockPeople } } as MockResponse);
    vi.mocked(hooks.useUsers).mockReturnValue({
      users: [],
      loading: false,
      error: '',
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      deleteUser: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage People')).toBeInTheDocument();
      expect(screen.getByText('Actor 1 (ACTOR)')).toBeInTheDocument();
      expect(screen.getByText('Director 1 (DIRECTOR)')).toBeInTheDocument();
    });
  });

  it('shows loading spinner when loading', () => {
    vi.mocked(api.movieAPI.getAllMovies).mockImplementation(() => new Promise(() => {}));
    vi.mocked(api.genreAPI.getAllGenres).mockResolvedValue({ data: { genres: [] } } as MockResponse);
    vi.mocked(api.personAPI.getAllPeople).mockResolvedValue({ data: { people: [] } } as MockResponse);
    vi.mocked(hooks.useUsers).mockReturnValue({
      users: [],
      loading: true,
      error: '',
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      deleteUser: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('opens movie form modal when add button clicked', async () => {
    vi.mocked(api.movieAPI.getAllMovies).mockResolvedValue({ data: { movies: [] } } as MockResponse);
    vi.mocked(api.genreAPI.getAllGenres).mockResolvedValue({ data: { genres: [] } } as MockResponse);
    vi.mocked(api.personAPI.getAllPeople).mockResolvedValue({ data: { people: [] } } as MockResponse);
    vi.mocked(hooks.useUsers).mockReturnValue({
      users: [],
      loading: false,
      error: '',
      blockUser: vi.fn(),
      unblockUser: vi.fn(),
      deleteUser: vi.fn(),
      refetch: vi.fn(),
    });

    render(
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const addButton = screen.getByText('Add Movie Manually');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Add Movie')).toBeInTheDocument();
    });
  });
});
