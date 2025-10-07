import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../src/pages/Home';
import * as AuthContext from '../src/services/AuthContext';
import * as hooks from '../src/hooks';

vi.mock('../src/hooks', () => ({
  useMovies: vi.fn(),
  useRecommendations: vi.fn(),
}));

vi.mock('../src/services/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Home Component', () => {
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
      genres: [{ id: '1', genre: { id: '1', name: 'Action' } }],
      credits: [],
      userRatings: [],
    },
    {
      id: '2',
      title: 'Test Movie 2',
      releaseYear: 2024,
      plot: 'Test plot 2',
      posterUrl: 'https://example.com/poster2.jpg',
      genres: [{ id: '2', genre: { id: '2', name: 'Drama' } }],
      credits: [],
      userRatings: [],
    },
  ];

  const mockRecommendations = [
    {
      id: '3',
      title: 'Recommended Movie',
      releaseYear: 2022,
      plot: 'Recommended plot',
      posterUrl: 'https://example.com/poster3.jpg',
      genres: [{ id: '3', genre: { id: '3', name: 'Comedy' } }],
      credits: [],
      userRatings: [],
    },
  ];

  it('renders page title', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: false,
    });

    vi.mocked(hooks.useMovies).mockReturnValue({
      movies: [],
      loading: false,
      error: null,
    });

    vi.mocked(hooks.useRecommendations).mockReturnValue({
      recommendations: [],
      loading: false,
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: 'Browse Movies', level: 1 })).toBeInTheDocument();
  });

  it('displays search form', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: false,
    });

    vi.mocked(hooks.useMovies).mockReturnValue({
      movies: [],
      loading: false,
      error: null,
    });

    vi.mocked(hooks.useRecommendations).mockReturnValue({
      recommendations: [],
      loading: false,
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('Search by title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by genre')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by person')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('displays movies when loaded', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: false,
    });

    vi.mocked(hooks.useMovies).mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
    });

    vi.mocked(hooks.useRecommendations).mockReturnValue({
      recommendations: [],
      loading: false,
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
    expect(screen.getByText('Test Movie 2')).toBeInTheDocument();
  });

  it('displays recommendations for authenticated users', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', username: 'testuser', role: 'USER', isBlocked: false },
      token: 'fake-token',
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: true,
    });

    vi.mocked(hooks.useMovies).mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
    });

    vi.mocked(hooks.useRecommendations).mockReturnValue({
      recommendations: mockRecommendations,
      loading: false,
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText('Recommended For You')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered')).toBeInTheDocument();
    expect(screen.getByText('Recommended Movie')).toBeInTheDocument();
  });

  it('does not display recommendations for unauthenticated users', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: false,
    });

    vi.mocked(hooks.useMovies).mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
    });

    vi.mocked(hooks.useRecommendations).mockReturnValue({
      recommendations: [],
      loading: false,
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.queryByText('Recommended For You')).not.toBeInTheDocument();
  });

  it('handles search form submission', async () => {
    const mockUseMovies = vi.fn().mockReturnValue({
      movies: mockMovies,
      loading: false,
      error: null,
    });

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: false,
    });

    vi.mocked(hooks.useMovies).mockImplementation(mockUseMovies);

    vi.mocked(hooks.useRecommendations).mockReturnValue({
      recommendations: [],
      loading: false,
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const titleInput = screen.getByPlaceholderText('Search by title');
    const searchButton = screen.getByRole('button', { name: 'Search' });

    fireEvent.change(titleInput, { target: { value: 'Test Movie' } });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockUseMovies).toHaveBeenCalled();
    });
  });

  it('displays message when no movies found', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: false,
    });

    vi.mocked(hooks.useMovies).mockReturnValue({
      movies: [],
      loading: false,
      error: null,
    });

    vi.mocked(hooks.useRecommendations).mockReturnValue({
      recommendations: [],
      loading: false,
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByText(/No movies found/i)).toBeInTheDocument();
  });

  it('displays loading spinner when loading', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: false,
    });

    vi.mocked(hooks.useMovies).mockReturnValue({
      movies: [],
      loading: true,
      error: null,
    });

    vi.mocked(hooks.useRecommendations).mockReturnValue({
      recommendations: [],
      loading: false,
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
