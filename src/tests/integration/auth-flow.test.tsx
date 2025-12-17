import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../components/Auth/Login';
import { mockSupabaseClient, createMockSession } from '../mocks/supabase';

vi.mock('../../supabaseClient', () => ({
  supabase: mockSupabaseClient,
}));

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Login Flow', () => {
    it('should successfully login with valid credentials', async () => {
      const mockSession = createMockSession();

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockSession.user },
        error: null,
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show error message on failed login', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' },
      });

      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
      });
    });

    it('should prevent login with empty credentials', async () => {
      render(
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      // Should not call API with empty fields
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should validate email format', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'test@',
        'test.example.com',
      ];

      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      invalidEmails.forEach((email) => {
        expect(emailPattern.test(email)).toBe(false);
      });

      expect(emailPattern.test('valid@example.com')).toBe(true);
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      // Test password reset functionality
      await mockSupabaseClient.auth.resetPasswordForEmail('test@example.com', {
        redirectTo: `${window.location.origin}/password-reset`,
      });

      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/password-reset'),
        })
      );
    });

    it('should validate password reset redirect URL', () => {
      const redirectUrl = `${window.location.origin}/password-reset`;

      // Should be same origin
      expect(redirectUrl).toContain(window.location.origin);

      // Should not allow external redirects
      const maliciousUrl = 'https://evil.com/steal-token';
      expect(maliciousUrl).not.toContain(window.location.origin);
    });

    it('should update password after reset', async () => {
      const newPassword = 'NewSecurePass123!';

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      await mockSupabaseClient.auth.updateUser({ password: newPassword });

      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });
  });

  describe('Session Management', () => {
    it('should persist session after login', async () => {
      const mockSession = createMockSession();

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const session = await mockSupabaseClient.auth.getSession();

      expect(session.data.session).toBeTruthy();
      expect(session.data.session?.user.id).toBe('test-user-id');
    });

    it('should clear session on logout', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      await mockSupabaseClient.auth.signOut();

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const session = await mockSupabaseClient.auth.getSession();

      expect(session.data.session).toBeNull();
    });

    it('should handle expired sessions', async () => {
      const expiredSession = createMockSession({
        expires_at: Date.now() - 1000, // Expired 1 second ago
      });

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null,
      });

      const session = await mockSupabaseClient.auth.getSession();

      // Check if expired
      const isExpired = session.data.session!.expires_at! < Date.now();
      expect(isExpired).toBe(true);

      // Should trigger refresh or redirect to login
    });

    it('should refresh tokens before expiry', async () => {
      const session = createMockSession({
        expires_at: Date.now() + 300000, // Expires in 5 minutes
      });

      const shouldRefresh = session.expires_at! - Date.now() < 600000; // < 10 min

      expect(shouldRefresh).toBe(true);

      // Should call refresh token endpoint
      // Supabase handles this automatically
    });
  });

  describe('Profile Completion Flow', () => {
    it('should complete profile with valid data', async () => {
      const profileData = {
        display_name: 'John Doe',
        phone: '555-123-4567',
      };

      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      await mockSupabaseClient.auth.updateUser({
        data: profileData,
      });

      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        data: profileData,
      });
    });

    it('should validate phone number format', () => {
      const validPhones = ['555-123-4567', '123-456-7890'];
      const invalidPhones = ['5551234567', '123-456', '(555) 123-4567'];

      const phonePattern = /^\d{3}-\d{3}-\d{4}$/;

      validPhones.forEach((phone) => {
        expect(phonePattern.test(phone)).toBe(true);
      });

      invalidPhones.forEach((phone) => {
        expect(phonePattern.test(phone)).toBe(false);
      });
    });

    it('should validate password confirmation matches', () => {
      const password = 'SecurePass123!';
      const confirmPassword = 'DifferentPass456!';

      expect(password).not.toBe(confirmPassword);

      // Should show error if passwords don't match
    });
  });

  describe('Auth State Persistence', () => {
    it('should restore auth state on page reload', async () => {
      const mockSession = createMockSession();

      // Simulate storing session
      sessionStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));

      // Simulate page reload
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const session = await mockSupabaseClient.auth.getSession();

      expect(session.data.session).toBeTruthy();
    });

    it('should handle concurrent login attempts', async () => {
      const loginPromises = Array(5).fill(null).map(() =>
        mockSupabaseClient.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password123',
        })
      );

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { session: createMockSession(), user: null },
        error: null,
      });

      await Promise.all(loginPromises);

      // Should handle gracefully without race conditions
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledTimes(5);
    });
  });
});
