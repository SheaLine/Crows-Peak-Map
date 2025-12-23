import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RoleProvider, useRole } from '../../RoleContext';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { mockSupabaseClient, createMockSession, createMockAdminSession } from '../mocks/supabase';

// Mock the supabase client
vi.mock('../../supabaseClient', () => ({
  supabase: mockSupabaseClient,
}));

// Test component to access the role context
function TestComponent() {
  const { isAdmin, loading } = useRole();

  if (loading) return <div>Loading...</div>;
  return <div>{isAdmin ? 'Admin User' : 'Regular User'}</div>;
}

describe('RoleContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should identify admin user from app_metadata', async () => {
    const adminSession = createMockAdminSession();

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: adminSession },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user' }, // Profile says user
        error: null,
      }),
    });

    render(
      <SessionContextProvider supabaseClient={mockSupabaseClient}>
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      </SessionContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    // app_metadata.is_admin should take precedence
  });

  it('should identify admin user from profiles table as fallback', async () => {
    const userSession = createMockSession(); // No admin in app_metadata

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: userSession },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'admin' }, // Profile says admin
        error: null,
      }),
    });

    render(
      <SessionContextProvider supabaseClient={mockSupabaseClient}>
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      </SessionContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  it('should identify regular user correctly', async () => {
    const userSession = createMockSession();

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: userSession },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null,
      }),
    });

    render(
      <SessionContextProvider supabaseClient={mockSupabaseClient}>
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      </SessionContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Regular User')).toBeInTheDocument();
    });
  });

  it('should handle missing profile gracefully', async () => {
    const userSession = createMockSession();

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: userSession },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' },
      }),
    });

    render(
      <SessionContextProvider supabaseClient={mockSupabaseClient}>
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      </SessionContextProvider>
    );

    await waitFor(() => {
      // Should default to regular user if profile missing
      expect(screen.getByText('Regular User')).toBeInTheDocument();
    });
  });

  it('should update role when session changes', async () => {
    const userSession = createMockSession();

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: userSession },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null,
      }),
    });

    const { rerender } = render(
      <SessionContextProvider supabaseClient={mockSupabaseClient}>
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      </SessionContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Regular User')).toBeInTheDocument();
    });

    // Simulate session change to admin
    const adminSession = createMockAdminSession();

    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: adminSession },
      error: null,
    });

    rerender(
      <SessionContextProvider supabaseClient={mockSupabaseClient}>
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      </SessionContextProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    mockSupabaseClient.auth.getSession.mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    render(
      <SessionContextProvider supabaseClient={mockSupabaseClient}>
        <RoleProvider>
          <TestComponent />
        </RoleProvider>
      </SessionContextProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
