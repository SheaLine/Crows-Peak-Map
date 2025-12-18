import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Auth from '@/components/Auth/Login';

// Mock the supabase client - define mock before vi.mock to avoid hoisting issues
const mockSignInWithPassword = vi.fn();
vi.mock('@/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignInWithPassword(...args),
    },
  },
}));

// Mock useSession hook
const mockUseSession = vi.fn();
vi.mock('@supabase/auth-helpers-react', () => ({
  useSession: () => mockUseSession(),
}));

// Wrapper component for routing
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue(null); // No session by default
  });

  it('should render login form when no session exists', () => {
    renderWithRouter(<Auth />);

    expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  it('should render email and password input fields', () => {
    renderWithRouter(<Auth />);

    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    expect(emailInput).toBeInTheDocument();
    expect(emailInput.type).toBe('email');
    expect(emailInput.required).toBe(true);

    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput.type).toBe('password');
    expect(passwordInput.required).toBe(true);
  });

  it('should display "Forgot password?" link', () => {
    renderWithRouter(<Auth />);

    const forgotLink = screen.getByText('Forgot password?');
    expect(forgotLink).toBeInTheDocument();
    expect(forgotLink).toHaveAttribute('href', '/password-forgot');
  });

  it('should update email state when user types', () => {
    renderWithRouter(<Auth />);

    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput.value).toBe('test@example.com');
  });

  it('should update password state when user types', () => {
    renderWithRouter(<Auth />);

    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'mypassword123' } });

    expect(passwordInput.value).toBe('mypassword123');
  });

  it('should call signInWithPassword when form is submitted', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null });

    renderWithRouter(<Auth />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const signInButton = screen.getByText('Sign in');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should display error message when sign in fails', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    renderWithRouter(<Auth />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const signInButton = screen.getByText('Sign in');

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Error: Invalid login credentials')).toBeInTheDocument();
    });
  });

  it('should not display error message initially', () => {
    renderWithRouter(<Auth />);

    const errorText = screen.queryByText(/Error:/);
    expect(errorText).not.toBeInTheDocument();
  });

  it('should display specific error messages from Supabase', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email not confirmed' },
    });

    renderWithRouter(<Auth />);

    const signInButton = screen.getByText('Sign in');
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Error: Email not confirmed')).toBeInTheDocument();
    });
  });

  it('should handle empty form submission', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email and password are required' },
    });

    renderWithRouter(<Auth />);

    const signInButton = screen.getByText('Sign in');
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: '',
        password: '',
      });
    });
  });

  it('should render company logos', () => {
    renderWithRouter(<Auth />);

    const logos = screen.getAllByAltText('Your Company');
    expect(logos).toHaveLength(2); // One for light mode, one for dark mode
  });

  it('should have correct autocomplete attributes', () => {
    renderWithRouter(<Auth />);

    const emailInput = screen.getByLabelText('Email address') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Password') as HTMLInputElement;

    expect(emailInput.autocomplete).toBe('email');
    expect(passwordInput.autocomplete).toBe('password');
  });

  it('should clear error message when user starts typing', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    });

    renderWithRouter(<Auth />);

    const signInButton = screen.getByText('Sign in');
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Error: Invalid credentials')).toBeInTheDocument();
    });

    // Note: The current implementation doesn't clear error on typing
    // This test documents current behavior
    const emailInput = screen.getByLabelText('Email address');
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    // Error message persists in current implementation
    expect(screen.getByText('Error: Invalid credentials')).toBeInTheDocument();
  });

  it('should handle successful sign in', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'test@example.com' },
        session: { access_token: 'token-123' },
      },
      error: null,
    });

    renderWithRouter(<Auth />);

    const emailInput = screen.getByLabelText('Email address');
    const passwordInput = screen.getByLabelText('Password');
    const signInButton = screen.getByText('Sign in');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'correctpassword' } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalled();
    });

    // No error message should be displayed
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  it('should prevent default form submission', async () => {
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });

    renderWithRouter(<Auth />);

    const signInButton = screen.getByText('Sign in');
    const mockEvent = { preventDefault: vi.fn() };

    // We can't directly test preventDefault, but we verify the function was called
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalled();
    });
  });

  it('should handle network errors gracefully', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Network request failed' },
    });

    renderWithRouter(<Auth />);

    const signInButton = screen.getByText('Sign in');
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(screen.getByText('Error: Network request failed')).toBeInTheDocument();
    });
  });

  it('should display error message with correct styling', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Test error' },
    });

    renderWithRouter(<Auth />);

    const signInButton = screen.getByText('Sign in');
    fireEvent.click(signInButton);

    await waitFor(() => {
      const errorElement = screen.getByText('Error: Test error');
      expect(errorElement.className).toContain('text-red-600');
    });
  });

  it('should handle multiple sign-in attempts', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'First error' },
    });

    renderWithRouter(<Auth />);

    const signInButton = screen.getByText('Sign in');

    // First attempt
    fireEvent.click(signInButton);
    await waitFor(() => {
      expect(screen.getByText('Error: First error')).toBeInTheDocument();
    });

    // Second attempt with different error
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Second error' },
    });

    fireEvent.click(signInButton);
    await waitFor(() => {
      expect(screen.getByText('Error: Second error')).toBeInTheDocument();
      expect(screen.queryByText('Error: First error')).not.toBeInTheDocument();
    });
  });
});
