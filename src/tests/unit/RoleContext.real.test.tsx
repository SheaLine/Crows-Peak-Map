import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RoleProvider, useRole } from '@/RoleContext';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import type { Session } from '@supabase/supabase-js';

// Create a mock single function that we can control
const mockSingle = vi.fn();

// Mock the supabase client with proper chaining
vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSingle,
        }),
      }),
    })),
  },
}));

// Test component that uses the hook
function TestComponent() {
  const { isAdmin, loading } = useRole();
  return (
    <div>
      <div data-testid="admin-status">{isAdmin ? 'admin' : 'user'}</div>
      <div data-testid="loading-status">{loading ? 'loading' : 'loaded'}</div>
    </div>
  );
}

describe('RoleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockClear();
    mockSingle.mockReset();
  });

  describe('useRole hook', () => {
    it('should return initial state when no session', async () => {
      const mockClient = {
        auth: {
          getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
          onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
          })),
        },
      } as any;

      render(
        <SessionContextProvider supabaseClient={mockClient}>
          <RoleProvider>
            <TestComponent />
          </RoleProvider>
        </SessionContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('admin-status')).toHaveTextContent('user');
    });

    it('should detect admin from app_metadata', async () => {
      const adminSession: Partial<Session> = {
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
          app_metadata: { is_admin: true },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
      } as Session;

      const mockClient = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: adminSession },
            error: null
          }),
          onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
          })),
        },
      } as any;

      render(
        <SessionContextProvider supabaseClient={mockClient} initialSession={adminSession as Session}>
          <RoleProvider>
            <TestComponent />
          </RoleProvider>
        </SessionContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('admin-status')).toHaveTextContent('admin');
    });

    it('should fallback to profiles table when app_metadata is not admin', async () => {
      const userSession: Partial<Session> = {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          app_metadata: { is_admin: false },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
      } as Session;

      // Mock the supabase query response
      mockSingle.mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      });

      const mockClient = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: userSession },
            error: null
          }),
          onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
          })),
        },
      } as any;

      render(
        <SessionContextProvider supabaseClient={mockClient} initialSession={userSession as Session}>
          <RoleProvider>
            <TestComponent />
          </RoleProvider>
        </SessionContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('admin-status')).toHaveTextContent('admin');
    });

    it('should treat user as non-admin when profiles table says user', async () => {
      const userSession: Partial<Session> = {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          app_metadata: { is_admin: false },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
      } as Session;

      // Mock the supabase query response
      mockSingle.mockResolvedValue({
        data: { role: 'user' },
        error: null,
      });

      const mockClient = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: userSession },
            error: null
          }),
          onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
          })),
        },
      } as any;

      render(
        <SessionContextProvider supabaseClient={mockClient}>
          <RoleProvider>
            <TestComponent />
          </RoleProvider>
        </SessionContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('admin-status')).toHaveTextContent('user');
    });

    it('should prioritize app_metadata over profiles table', async () => {
      // If app_metadata says admin, don't even check profiles table
      const adminSession: Partial<Session> = {
        user: {
          id: 'admin-user-id',
          email: 'admin@example.com',
          app_metadata: { is_admin: true },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
      } as Session;

      mockSingle.mockResolvedValue({
        data: { role: 'user' }, // Profiles says user, but app_metadata says admin
        error: null,
      });

      const mockClient = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: adminSession },
            error: null
          }),
          onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
          })),
        },
      } as any;

      render(
        <SessionContextProvider supabaseClient={mockClient} initialSession={adminSession as Session}>
          <RoleProvider>
            <TestComponent />
          </RoleProvider>
        </SessionContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('loaded');
      });

      // Should be admin from app_metadata
      expect(screen.getByTestId('admin-status')).toHaveTextContent('admin');

      // Should NOT have called profiles table
      expect(mockSingle).not.toHaveBeenCalled();
    });

    it('should handle profiles table query error gracefully', async () => {
      const userSession: Partial<Session> = {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          app_metadata: { is_admin: false },
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        },
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 3600,
        token_type: 'bearer',
      } as Session;

      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const mockClient = {
        auth: {
          getSession: vi.fn().mockResolvedValue({
            data: { session: userSession },
            error: null
          }),
          onAuthStateChange: vi.fn(() => ({
            data: { subscription: { unsubscribe: vi.fn() } },
          })),
        },
      } as any;

      render(
        <SessionContextProvider supabaseClient={mockClient}>
          <RoleProvider>
            <TestComponent />
          </RoleProvider>
        </SessionContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('loaded');
      });

      // Should default to non-admin on error
      expect(screen.getByTestId('admin-status')).toHaveTextContent('user');
    });
  });
});
