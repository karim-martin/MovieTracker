import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from '../src/components/AdminRoute';
import * as AuthContext from '../src/services/AuthContext';

vi.mock('../src/services/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('AdminRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const AdminComponent = () => <div>Admin Content</div>;
  const LoginComponent = () => <div>Login Page</div>;
  const HomeComponent = () => <div>Home Page</div>;

  const renderAdminRoute = () => {
    return render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminComponent />
              </AdminRoute>
            }
          />
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/" element={<HomeComponent />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('renders children when user is admin', () => {
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

    renderAdminRoute();

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
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

    renderAdminRoute();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('redirects to home when user is authenticated but not admin', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', email: 'user@example.com', username: 'user', role: 'USER', isBlocked: false },
      token: 'fake-user-token',
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: true,
    });

    renderAdminRoute();

    expect(screen.getByText('Home Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
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

    renderAdminRoute();

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
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

    renderAdminRoute();

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('works with different admin child components', () => {
    const DifferentAdminComponent = () => <div>Different Admin Content</div>;

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

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <DifferentAdminComponent />
              </AdminRoute>
            }
          />
          <Route path="/login" element={<LoginComponent />} />
          <Route path="/" element={<HomeComponent />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Different Admin Content')).toBeInTheDocument();
  });

  it('checks both isAuthenticated and isAdmin flags', () => {
    // Test case where isAdmin is true but isAuthenticated is false (edge case)
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: true, // This shouldn't happen in real app but test the logic
      isAuthenticated: false,
    });

    renderAdminRoute();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
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

    renderAdminRoute();

    // Should show login page immediately
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects immediately after loading completes when not admin', () => {
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', email: 'user@example.com', username: 'user', role: 'USER', isBlocked: false },
      token: 'fake-user-token',
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isAdmin: false,
      isAuthenticated: true,
    });

    renderAdminRoute();

    // Should show home page immediately
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});
