import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyMovies from '../src/pages/MyMovies';
import * as hooks from '../src/hooks';

vi.mock('../src/hooks', () => ({
  useRatings: vi.fn(),
}));

describe('MyMovies Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRatings = [
    {
      id: '1',
      rating: 8,
      watchedDate: '2024-01-15',
      movie: {
        id: '1',
        title: 'Test Movie 1',
        releaseYear: 2023,
        plot: 'Test plot 1',
        posterUrl: 'https://example.com/poster1.jpg',
      },
      user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'USER' as const, isBlocked: false },
    },
    {
      id: '2',
      rating: 9,
      watchedDate: '2024-02-20',
      movie: {
        id: '2',
        title: 'Test Movie 2',
        releaseYear: 2024,
        plot: 'Test plot 2',
        posterUrl: 'https://example.com/poster2.jpg',
      },
      user: { id: '1', username: 'testuser', email: 'test@example.com', role: 'USER' as const, isBlocked: false },
    },
  ];

  it('renders page title', () => {
    vi.mocked(hooks.useRatings).mockReturnValue({
      ratings: [],
      loading: false,
      error: '',
      refetch: vi.fn(),
      createRating: vi.fn(),
      updateRating: vi.fn(),
      deleteRating: vi.fn(),
    });

    render(
      <BrowserRouter>
        <MyMovies />
      </BrowserRouter>
    );

    expect(screen.getByText('My Watched Movies')).toBeInTheDocument();
  });

  it('displays ratings table when ratings exist', () => {
    vi.mocked(hooks.useRatings).mockReturnValue({
      ratings: mockRatings,
      loading: false,
      error: '',
      refetch: vi.fn(),
      createRating: vi.fn(),
      updateRating: vi.fn(),
      deleteRating: vi.fn(),
    });

    render(
      <BrowserRouter>
        <MyMovies />
      </BrowserRouter>
    );

    expect(screen.getByText('Test Movie 1')).toBeInTheDocument();
    expect(screen.getByText('Test Movie 2')).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('9/10')).toBeInTheDocument();
  });

  it('displays table headers', () => {
    vi.mocked(hooks.useRatings).mockReturnValue({
      ratings: mockRatings,
      loading: false,
      error: '',
      refetch: vi.fn(),
      createRating: vi.fn(),
      updateRating: vi.fn(),
      deleteRating: vi.fn(),
    });

    render(
      <BrowserRouter>
        <MyMovies />
      </BrowserRouter>
    );

    expect(screen.getByText('Movie')).toBeInTheDocument();
    expect(screen.getByText('Year')).toBeInTheDocument();
    expect(screen.getByText('My Rating')).toBeInTheDocument();
    expect(screen.getByText('Watched Date')).toBeInTheDocument();
  });

  it('displays release years for rated movies', () => {
    vi.mocked(hooks.useRatings).mockReturnValue({
      ratings: mockRatings,
      loading: false,
      error: '',
      refetch: vi.fn(),
      createRating: vi.fn(),
      updateRating: vi.fn(),
      deleteRating: vi.fn(),
    });

    render(
      <BrowserRouter>
        <MyMovies />
      </BrowserRouter>
    );

    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('2024')).toBeInTheDocument();
  });

  it('displays formatted watched dates', () => {
    vi.mocked(hooks.useRatings).mockReturnValue({
      ratings: mockRatings,
      loading: false,
      error: '',
      refetch: vi.fn(),
      createRating: vi.fn(),
      updateRating: vi.fn(),
      deleteRating: vi.fn(),
    });

    render(
      <BrowserRouter>
        <MyMovies />
      </BrowserRouter>
    );

    // Dates are formatted using toLocaleDateString
    const date1 = new Date('2024-01-15').toLocaleDateString();
    const date2 = new Date('2024-02-20').toLocaleDateString();

    expect(screen.getByText(date1)).toBeInTheDocument();
    expect(screen.getByText(date2)).toBeInTheDocument();
  });

  it('displays message when no ratings exist', () => {
    vi.mocked(hooks.useRatings).mockReturnValue({
      ratings: [],
      loading: false,
      error: '',
      refetch: vi.fn(),
      createRating: vi.fn(),
      updateRating: vi.fn(),
      deleteRating: vi.fn(),
    });

    render(
      <BrowserRouter>
        <MyMovies />
      </BrowserRouter>
    );

    expect(screen.getByText(/You haven't rated any movies yet/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse movies/i)).toBeInTheDocument();
  });

  it('displays loading spinner when loading', () => {
    vi.mocked(hooks.useRatings).mockReturnValue({
      ratings: [],
      loading: true,
      error: '',
      refetch: vi.fn(),
      createRating: vi.fn(),
      updateRating: vi.fn(),
      deleteRating: vi.fn(),
    });

    render(
      <BrowserRouter>
        <MyMovies />
      </BrowserRouter>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders movie titles as links', () => {
    vi.mocked(hooks.useRatings).mockReturnValue({
      ratings: mockRatings,
      loading: false,
      error: '',
      refetch: vi.fn(),
      createRating: vi.fn(),
      updateRating: vi.fn(),
      deleteRating: vi.fn(),
    });

    render(
      <BrowserRouter>
        <MyMovies />
      </BrowserRouter>
    );

    const movie1Link = screen.getByRole('link', { name: 'Test Movie 1' });
    const movie2Link = screen.getByRole('link', { name: 'Test Movie 2' });

    expect(movie1Link).toHaveAttribute('href', '/movies/1');
    expect(movie2Link).toHaveAttribute('href', '/movies/2');
  });

  it('renders browse movies link when no ratings', () => {
    vi.mocked(hooks.useRatings).mockReturnValue({
      ratings: [],
      loading: false,
      error: '',
      refetch: vi.fn(),
      createRating: vi.fn(),
      updateRating: vi.fn(),
      deleteRating: vi.fn(),
    });

    render(
      <BrowserRouter>
        <MyMovies />
      </BrowserRouter>
    );

    const browseLink = screen.getByRole('link', { name: /Browse movies/i });
    expect(browseLink).toHaveAttribute('href', '/');
  });
});
