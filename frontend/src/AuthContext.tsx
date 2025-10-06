import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { authAPI } from './services/api';
import { User, LoginInput, RegisterInput, AuthResponse, APIError } from './types';

interface JWTPayload {
  exp: number;
  userId?: string;
  email?: string;
  role?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const decoded = jwtDecode<JWTPayload>(storedToken);

        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        } else {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as User);
        }
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const loginData: LoginInput = { email, password };
      const response = await authAPI.login(loginData);
      const authResponse: AuthResponse = response.data;
      const { token: newToken, user: newUser } = authResponse;

      if (newUser.isBlocked) {
        throw new Error('Your account has been blocked. Please contact administrator.');
      }

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (err) {
      const error = err as APIError;
      throw new Error(error.response?.data?.error || error.message || 'Login failed');
    }
  };

  const register = async (email: string, username: string, password: string): Promise<void> => {
    try {
      const registerData: RegisterInput = { email, username, password };
      const response = await authAPI.register(registerData);
      const authResponse: AuthResponse = response.data;
      const { token: newToken, user: newUser } = authResponse;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (err) {
      const error = err as APIError;
      throw new Error(error.response?.data?.error || error.message || 'Registration failed');
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, isAuthenticated,}}>
      {children}
    </AuthContext.Provider>
  );
};

// Export hook separately to avoid fast-refresh issues
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
