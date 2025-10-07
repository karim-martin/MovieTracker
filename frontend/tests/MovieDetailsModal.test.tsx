import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MovieDetailsModal } from '../src/components/MovieDetailsModal';
import * as AuthContext from '../src/services/AuthContext';
import * as api from '../src/services/api';

vi.mock('../src/services/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../src/services/api', () => ({
  ratingAPI: {
    createRating: vi.fn(),
  },
}));

describe('MovieDetailsModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMovie = {
    id: '1',
    title: 'Test Movie',
    releaseYear: 2023,
    plot: 'This is a test plot',
    posterUrl: 'https://example.com/poster.jpg',
    genres: [
      { id: '1', genre: { id: '1', name: 'Action' } },
      { id: '2', genre: { id: '2', name: 'Drama' } },
    ],
    credits: [
      { id: '1', role: 'director', person: { id: '1', name: 'Director Name' }, characterName: null },
      { id: '2', role: 'actor', person: { id: '2', name: 'Actor Name' }, characterName: 'Character Name' },
      { id: '3', role: 'producer', person: { id: '3', name: 'Producer Name' }, characterName: null },
    ],
    userRatings: [
      { id: '1', rating: 8, user: { id: '1', username: 'user1' } },
      { id: '2', rating: 9, user: { id: '2', username: 'user2' } },
    ],
    externalRatings: [
      { id: '1', source: 'TMDB', rating: 7.5, ratingCount: 1000 },
    ],
  };

  it('does not render when show is false', () => {
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

    const { container } = render(
      <BrowserRouter>
        <MovieDetailsModal show={false} movie={null} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders movie details when show is true', () => {
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

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Test Movie \(2023\)/)).toBeInTheDocument();
    expect(screen.getByText('This is a test plot')).toBeInTheDocument();
  });

  it('displays genres', () => {
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

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Drama')).toBeInTheDocument();
  });

  it('displays directors', () => {
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

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Director:/)).toBeInTheDocument();
    expect(screen.getByText('Director Name')).toBeInTheDocument();
  });

  it('displays producers', () => {
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

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText(/Producer:/)).toBeInTheDocument();
    expect(screen.getByText('Producer Name')).toBeInTheDocument();
  });

  it('displays cast with character names', () => {
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

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Actor Name')).toBeInTheDocument();
    expect(screen.getByText(/as Character Name/)).toBeInTheDocument();
  });

  it('displays external ratings', () => {
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

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText(/TMDB: 7.5\/10/)).toBeInTheDocument();
    expect(screen.getByText(/\(1000 votes\)/)).toBeInTheDocument();
  });

  it('displays internal rating', () => {
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

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={vi.fn()} />
      </BrowserRouter>
    );

    // Average of 8 and 9 is 8.5
    expect(screen.getByText('8.5/10')).toBeInTheDocument();
    expect(screen.getByText(/\(2 user ratings\)/)).toBeInTheDocument();
  });

  it('displays rating form for authenticated users', () => {
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

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('Rate This Movie')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByLabelText('Watched Date')).toBeInTheDocument();
  });

  it('does not display rating form for unauthenticated users', () => {
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

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.queryByText('Rate This Movie')).not.toBeInTheDocument();
  });

  it('handles rating submission', async () => {
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

    vi.mocked(api.ratingAPI.createRating).mockResolvedValue({ data: {} } as never);

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={vi.fn()} />
      </BrowserRouter>
    );

    // Select rating (4 stars)
    const stars = screen.getAllByText('★');
    fireEvent.click(stars[3]);

    // Set watched date
    const dateInput = screen.getByLabelText('Watched Date');
    fireEvent.change(dateInput, { target: { value: '2024-01-15' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: 'Submit Rating' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(api.ratingAPI.createRating).toHaveBeenCalledWith({
        movieId: '1',
        rating: 8, // 4 stars * 2 = 8
        watchedDate: '2024-01-15',
      });
    });
  });

  it('displays user ratings section when ratings exist', () => {
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

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText('User Ratings')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('9/10')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const mockOnClose = vi.fn();
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

    render(
      <BrowserRouter>
        <MovieDetailsModal show={true} movie={mockMovie} onClose={mockOnClose} />
      </BrowserRouter>
    );

    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    // Click the footer close button (the last one)
    fireEvent.click(closeButtons[closeButtons.length - 1]);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
