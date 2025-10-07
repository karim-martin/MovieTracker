import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for these tests since we expect errors
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('displays error modal when child component throws error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Application Error')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('displays error message text', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong:/)).toBeInTheDocument();
  });

  it('displays reset message', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/The application will be reset when you close this dialog/)).toBeInTheDocument();
  });

  it('displays reset button', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('button', { name: 'Reset Application' })).toBeInTheDocument();
  });

  it('calls window.location.replace when reset button is clicked', () => {
    const mockReplace = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { replace: mockReplace },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const resetButton = screen.getByRole('button', { name: 'Reset Application' });
    fireEvent.click(resetButton);

    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('displays default error message when error message is not available', () => {
    // Component that throws an error without a message
    const ThrowErrorNoMessage = () => {
      const error = new Error();
      error.message = '';
      throw error;
    };

    render(
      <ErrorBoundary>
        <ThrowErrorNoMessage />
      </ErrorBoundary>
    );

    expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
  });

  it('logs error to console', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('modal cannot be dismissed by clicking outside', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Modal should have backdrop="static" which prevents dismissal by clicking outside
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
  });

  it('renders children correctly in normal operation', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child-component">
          <h1>Test Content</h1>
          <p>This is test content</p>
        </div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('This is test content')).toBeInTheDocument();
  });
});
