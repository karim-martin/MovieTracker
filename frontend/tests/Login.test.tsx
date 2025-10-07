import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../src/pages/Login';
import { AuthProvider } from '../src/services/AuthContext';
import * as AuthContext from '../src/services/AuthContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('renders login form', () => {
    renderLogin();
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('displays link to register page', () => {
    renderLogin();
    const registerLink = screen.getByText(/Don't have an account\? Register/i);
    expect(registerLink).toBeInTheDocument();
  });

  it('updates input fields on change', () => {
    renderLogin();
    const emailInput = screen.getByLabelText('Email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  it('handles successful login', async () => {
    const mockLogin = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      user: null,
      token: null,
      loading: false,
      isAdmin: false,
      isAuthenticated: false,
    });

    renderLogin();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('displays error message on login failure', async () => {
    const mockLogin = vi.fn().mockRejectedValue(new Error('Invalid credentials'));
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      user: null,
      token: null,
      loading: false,
      isAdmin: false,
      isAuthenticated: false,
    });

    renderLogin();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('shows loading state during login', async () => {
    const mockLogin = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      login: mockLogin,
      register: vi.fn(),
      logout: vi.fn(),
      user: null,
      token: null,
      loading: false,
      isAdmin: false,
      isAuthenticated: false,
    });

    renderLogin();

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
