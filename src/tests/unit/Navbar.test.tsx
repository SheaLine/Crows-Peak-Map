import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Navbar from '@/components/Navbar';

// Mock the supabase client
const mockSignOut = vi.fn();
const mockSupabaseClient = {
  auth: {
    signOut: mockSignOut,
  },
};

// Mock useSession
const mockUseSession = vi.fn();

// Mock useRole
const mockUseRole = vi.fn();

vi.mock('@supabase/auth-helpers-react', () => ({
  useSession: () => mockUseSession(),
  useSupabaseClient: () => mockSupabaseClient,
}));

vi.mock('@/RoleContext', () => ({
  useRole: () => mockUseRole(),
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRole.mockReturnValue({ isAdmin: false, loading: false });
    mockUseSession.mockReturnValue(null);
  });

  it('should render nothing when role is loading', () => {
    mockUseRole.mockReturnValue({ isAdmin: false, loading: true });

    const { container } = render(<Navbar />);

    expect(container.firstChild).toBeNull();
  });

  it('should render logo and app name', () => {
    mockUseRole.mockReturnValue({ isAdmin: false, loading: false });

    render(<Navbar />);

    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(screen.getByText("Crow's Peak Equipment Map")).toBeInTheDocument();
  });

  it('should render logout button', () => {
    render(<Navbar />);

    const logoutButton = screen.getByText('Logout');
    expect(logoutButton).toBeInTheDocument();
  });

  it('should display user email when session exists', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    };
    mockUseSession.mockReturnValue(mockSession);

    render(<Navbar />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should display "(Admin)" label for admin users', () => {
    const mockSession = {
      user: {
        id: 'admin-123',
        email: 'admin@example.com',
      },
    };
    mockUseSession.mockReturnValue(mockSession);
    mockUseRole.mockReturnValue({ isAdmin: true, loading: false });

    render(<Navbar />);

    expect(screen.getByText('admin@example.com (Admin)')).toBeInTheDocument();
  });

  it('should not display "(Admin)" label for regular users', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'user@example.com',
      },
    };
    mockUseSession.mockReturnValue(mockSession);
    mockUseRole.mockReturnValue({ isAdmin: false, loading: false });

    render(<Navbar />);

    expect(screen.getByText('user@example.com')).toBeInTheDocument();
    expect(screen.queryByText(/\(Admin\)/)).not.toBeInTheDocument();
  });

  it('should call signOut when logout button is clicked', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    render(<Navbar />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle logout success', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    render(<Navbar />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });

    // No error alert should be shown
  });

  it('should display alert and log error when logout fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const mockError = { message: 'Logout failed' };
    mockSignOut.mockResolvedValue({ error: mockError });

    render(<Navbar />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
      expect(alertSpy).toHaveBeenCalledWith('Logout failed: Logout failed');
    });

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('should render LogOut icon', () => {
    render(<Navbar />);

    const logoutButton = screen.getByText('Logout').closest('button');
    expect(logoutButton).toBeInTheDocument();

    // Icon is rendered as part of the button
    const svg = logoutButton?.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have correct styling for logout button', () => {
    render(<Navbar />);

    const logoutButton = screen.getByText('Logout').closest('button');
    expect(logoutButton?.className).toContain('bg-[#2f6ea8]');
    expect(logoutButton?.className).toContain('text-white');
    expect(logoutButton?.className).toContain('cursor-pointer');
  });

  it('should not display user info when no session', () => {
    mockUseSession.mockReturnValue(null);

    render(<Navbar />);

    // Only logout button should be visible, no email
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText(/@example\.com/)).not.toBeInTheDocument();
  });

  it('should handle session with missing email gracefully', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        // No email property
      },
    };
    mockUseSession.mockReturnValue(mockSession);

    render(<Navbar />);

    // Should not crash, may render empty string
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should render navbar with correct structure', () => {
    const { container } = render(<Navbar />);

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
    expect(nav?.className).toContain('flex');
    expect(nav?.className).toContain('justify-between');
  });

  it('should display logo with correct attributes', () => {
    render(<Navbar />);

    const logo = screen.getByAltText('Logo') as HTMLImageElement;
    expect(logo.src).toContain('/logo.png');
    expect(logo.className).toContain('h-16');
    expect(logo.className).toContain('w-16');
  });

  it('should hide app name on small screens', () => {
    render(<Navbar />);

    const appName = screen.getByText("Crow's Peak Equipment Map");
    expect(appName.className).toContain('hidden');
    expect(appName.className).toContain('sm:block');
  });

  it('should hide user email on small screens', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
      },
    };
    mockUseSession.mockReturnValue(mockSession);

    render(<Navbar />);

    const emailContainer = screen.getByText('test@example.com').parentElement;
    expect(emailContainer?.className).toContain('hidden');
    expect(emailContainer?.className).toContain('sm:flex');
  });

  it('should truncate long email addresses', () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'verylongemailaddress@verylongdomainname.com',
      },
    };
    mockUseSession.mockReturnValue(mockSession);

    render(<Navbar />);

    const emailElement = screen.getByText('verylongemailaddress@verylongdomainname.com');
    expect(emailElement.className).toContain('truncate');
    expect(emailElement.className).toContain('max-w-[500px]');
  });

  it('should handle multiple logout attempts', async () => {
    mockSignOut.mockResolvedValue({ error: null });

    render(<Navbar />);

    const logoutButton = screen.getByText('Logout');

    fireEvent.click(logoutButton);
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(2);
    });
  });

  it('should render with dark mode classes', () => {
    const { container } = render(<Navbar />);

    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('dark:bg-gray-700/40');
    expect(nav?.className).toContain('dark:border-gray-700');
  });

  it('should display different emails for different sessions', () => {
    const mockSession1 = {
      user: { id: 'user-1', email: 'user1@example.com' },
    };
    mockUseSession.mockReturnValue(mockSession1);

    const { rerender } = render(<Navbar />);

    expect(screen.getByText('user1@example.com')).toBeInTheDocument();

    // Change session
    const mockSession2 = {
      user: { id: 'user-2', email: 'user2@example.com' },
    };
    mockUseSession.mockReturnValue(mockSession2);

    rerender(<Navbar />);

    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    expect(screen.queryByText('user1@example.com')).not.toBeInTheDocument();
  });
});
