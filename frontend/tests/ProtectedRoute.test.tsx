import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../src/components/ProtectedRoute';
import * as AuthContext from '../src/services/AuthContext';

vi.mock('../src/services/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const TestComponent = () => <div>Protected Content</div>;
  const LoginComponent = () => <div>Login Page</div>;

  const renderProtectedRoute = () => {
    return render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TestComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginComponent />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders children when user is authenticated', () => {
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

    renderProtectedRoute();

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to login when user is not authenticated', () => {
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

    renderProtectedRoute();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('displays loading spinner while auth state is loading', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: false,
    });

    renderProtectedRoute();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('does not render children during loading state', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: false,
    });

    renderProtectedRoute();

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('works with different child components', () => {
    const DifferentComponent = () => <div>Different Protected Content</div>;

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
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DifferentComponent />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginComponent />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Different Protected Content')).toBeInTheDocument();
  });

  it('renders correctly with admin user', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', email: 'admin@example.com', username: 'admin', role: 'ADMIN', isBlocked: false },
      token: 'fake-admin-token',
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: true,
      isAuthenticated: true,
    });

    renderProtectedRoute();

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects immediately after loading completes when not authenticated', () => {
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

    renderProtectedRoute();

    // Should show login page immediately
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
});
