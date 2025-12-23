import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EquipmentDetails from '@/components/Details/EquipmentDetails';

// Mock dependencies
const mockNavigate = vi.fn();
const mockUseParams = vi.fn();
const mockUseSession = vi.fn();
const mockUseRole = vi.fn();

// Mock storage cache
const mockGetCachedUrls = vi.fn();
const mockSetCachedUrls = vi.fn();
const mockClearCache = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@supabase/auth-helpers-react', () => ({
  useSession: () => mockUseSession(),
}));

vi.mock('@/RoleContext', () => ({
  useRole: () => mockUseRole(),
}));

vi.mock('@/utils/cache', () => ({
  useStorageCache: () => ({
    getCachedUrls: mockGetCachedUrls,
    setCachedUrls: mockSetCachedUrls,
    clearCache: mockClearCache,
  }),
}));

// Create mock functions first
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockStorage = vi.fn();

// Mock supabase client
vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    rpc: (...args: any[]) => mockRpc(...args),
    storage: {
      from: (...args: any[]) => mockStorage(...args),
    },
  },
}));

// Mock child components
vi.mock('@/components/Details/PhotoUpload', () => ({
  default: ({ onUploaded, editMode }: { onUploaded: () => void; editMode: boolean }) => (
    <div data-testid="photo-upload">
      PhotoUpload
      {editMode && <button onClick={onUploaded}>Upload Photo</button>}
    </div>
  ),
}));

vi.mock('@/components/Details/MetaFacts', () => ({
  default: ({
    metadata,
    editMode,
    onFieldChange,
    onFieldDelete,
  }: {
    metadata: Record<string, unknown>;
    editMode: boolean;
    onFieldChange: (key: string, value: string) => void;
    onFieldDelete: (key: string) => void;
  }) => (
    <div data-testid="meta-facts">
      MetaFacts
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key} data-testid={`field-${key}`}>
          {key}: {String(value)}
          {editMode && (
            <>
              <button onClick={() => onFieldChange(key, 'updated')}>Edit {key}</button>
              <button onClick={() => onFieldDelete(key)}>Delete {key}</button>
            </>
          )}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@/components/Details/EquipmentNavbar', () => ({
  EquipmentNavbar: ({
    title,
    subtitle,
    onEdit,
    onCancel,
    showEdit,
    editMode,
  }: {
    title: string;
    subtitle: string;
    onEdit: () => void;
    onCancel: () => void;
    showEdit: boolean;
    editMode: boolean;
  }) => (
    <nav data-testid="equipment-navbar">
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {showEdit && (
        <>
          <button onClick={onEdit}>{editMode ? 'Save' : 'Edit'}</button>
          {editMode && <button onClick={onCancel}>Cancel</button>}
        </>
      )}
    </nav>
  ),
}));

vi.mock('@/components/Details/EquipmentTabs', () => ({
  default: ({ children }: { children: (activeTab: string) => React.ReactNode }) => (
    <div data-testid="equipment-tabs">
      {children('summary')}
    </div>
  ),
}));

vi.mock('@/components/Details/SummaryTab', () => ({
  default: ({ initialSummary }: { initialSummary: string | null }) => (
    <div data-testid="summary-tab">Summary: {initialSummary}</div>
  ),
}));

vi.mock('@/components/Details/LogsTab', () => ({
  default: () => <div data-testid="logs-tab">Logs</div>,
}));

vi.mock('@/components/Details/GalleryTab', () => ({
  default: () => <div data-testid="gallery-tab">Gallery</div>,
}));

vi.mock('@/components/Details/FilesTab', () => ({
  default: () => <div data-testid="files-tab">Files</div>,
}));

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('EquipmentDetails Component', () => {
  const mockEquipmentData = {
    id: 'eq-123',
    name: 'Test Equipment',
    description: 'Test Description',
    metadata: {
      model: 'XYZ-100',
      manufacturer: 'ACME Corp',
    },
    metadata_order: ['model', 'manufacturer'],
  };

  const mockAttachmentsData = [
    {
      id: 'att-1',
      url: 'path/to/image1.jpg',
      is_primary: true,
      uploaded_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'att-2',
      url: 'path/to/image2.jpg',
      is_primary: false,
      uploaded_at: '2025-01-02T00:00:00Z',
    },
  ];

  const mockSession = {
    user: { id: 'user-123', email: 'test@example.com' },
  };

  beforeEach(() => {
    // Clear mock call history but preserve implementations
    mockFrom.mockClear();
    mockRpc.mockClear();
    mockStorage.mockClear();
    mockUseParams.mockClear();
    mockUseSession.mockClear();
    mockUseRole.mockClear();
    mockGetCachedUrls.mockClear();
    mockSetCachedUrls.mockClear();
    mockClearCache.mockClear();

    // Mock matchMedia (required for mobile detection)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Default mocks
    mockUseParams.mockReturnValue({ id: 'eq-123' });
    mockUseSession.mockReturnValue(mockSession);
    mockUseRole.mockReturnValue({ isAdmin: false, loading: false });
    mockGetCachedUrls.mockReturnValue(null); // No cache by default

    // Mock successful equipment fetch
    mockFrom.mockImplementation((table: string) => {
      if (table === 'equipment_details') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockEquipmentData,
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'equipment') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { summary: 'Test summary' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'attachments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({
                data: mockAttachmentsData,
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    // Mock signed URLs
    mockStorage.mockReturnValue({
      createSignedUrls: vi.fn().mockResolvedValue({
        data: [
          { path: 'path/to/image1.jpg', signedUrl: 'https://signed.url/image1.jpg' },
          { path: 'path/to/image2.jpg', signedUrl: 'https://signed.url/image2.jpg' },
        ],
        error: null,
      }),
    });
  });

  // afterEach removed - we manually manage mocks in beforeEach
  // vi.restoreAllMocks() was causing issues when React components unmount

  describe('Authentication', () => {
    it('should redirect to login if no session', () => {
      mockUseSession.mockReturnValue(null);

      renderWithRouter(<EquipmentDetails />);

      expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('should not render content if no session', () => {
      mockUseSession.mockReturnValue(null);

      const { container } = renderWithRouter(<EquipmentDetails />);

      expect(container.firstChild).toBeNull();
    });

    it('should render when session exists', async () => {
      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('equipment-navbar')).toBeInTheDocument();
      });
    });
  });

  describe('Data Fetching', () => {
    it('should show loading spinner while fetching data', () => {
      const { container } = renderWithRouter(<EquipmentDetails />);

      // Loading spinner is a <span> with class "loading loading-spinner loading-xl"
      const spinner = container.querySelector('.loading.loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should fetch equipment details on mount', async () => {
      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('equipment_details');
      });
    });

    it('should fetch equipment summary from equipment table', async () => {
      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('equipment');
      });
    });

    it('should fetch attachments', async () => {
      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('attachments');
      });
    });

    it('should display equipment name and description', async () => {
      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Test Equipment')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
      });
    });

    it('should handle equipment fetch error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFrom.mockImplementation((table: string) => {
        if (table === 'equipment_details') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Equipment not found' },
                }),
              }),
            }),
          };
        }
        // Provide proper mocks for other tables to prevent unhandled rejections
        if (table === 'attachments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'equipment') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { summary: null },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching equipment: ',
          'Equipment not found'
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle attachments fetch error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockFrom.mockImplementation((table: string) => {
        if (table === 'equipment_details') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockEquipmentData,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'equipment') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { summary: 'Test summary' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'attachments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Attachments error' },
                }),
              }),
            }),
          };
        }
        return {};
      });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching attachments:',
          'Attachments error'
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should use cached URLs when available', async () => {
      const cachedUrls = new Map([
        ['path/to/image1.jpg', 'https://cached.url/image1.jpg'],
        ['path/to/image2.jpg', 'https://cached.url/image2.jpg'],
      ]);

      mockGetCachedUrls.mockReturnValue(cachedUrls);

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(mockGetCachedUrls).toHaveBeenCalled();
      });

      // Should not call createSignedUrls if cache hit
      expect(mockStorage).not.toHaveBeenCalled();
    });

    it('should fetch signed URLs when not cached', async () => {
      mockGetCachedUrls.mockReturnValue(null);

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(mockStorage).toHaveBeenCalledWith('equipment-attachments');
      });
    });

    it('should cache newly fetched signed URLs', async () => {
      mockGetCachedUrls.mockReturnValue(null);

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(mockSetCachedUrls).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should not show edit button for non-admin users', async () => {
      mockUseRole.mockReturnValue({ isAdmin: false, loading: false });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.queryByText('Edit')).not.toBeInTheDocument();
      });
    });

    it('should show edit button for admin users', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });
    });

    it('should toggle edit mode when edit button is clicked', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('should show cancel button in edit mode', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should show add field form in edit mode', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Key (e.g., Model)')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Value (comma-separated for lists)')).toBeInTheDocument();
      });
    });

    it('should refetch data when cancel is clicked', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      const initialCallCount = mockFrom.mock.calls.length;

      fireEvent.click(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(mockFrom.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Metadata Management', () => {
    it('should display metadata fields', async () => {
      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('field-model')).toBeInTheDocument();
        expect(screen.getByTestId('field-manufacturer')).toBeInTheDocument();
      });
    });

    it('should call upsert RPC when adding new field', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });
      mockRpc.mockResolvedValue({ data: null, error: null });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      const keyInput = screen.getByPlaceholderText('Key (e.g., Model)');
      const valueInput = screen.getByPlaceholderText('Value (comma-separated for lists)');
      const addButton = screen.getByText('Add');

      fireEvent.change(keyInput, { target: { value: 'new_field' } });
      fireEvent.change(valueInput, { target: { value: 'new_value' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('equipment_upsert_metadata', {
          p_equipment_id: 'eq-123',
          p_key: 'new_field',
          p_value: 'new_value',
        });
      });
    });

    it('should convert comma-separated values to array when adding field', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });
      mockRpc.mockResolvedValue({ data: null, error: null });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      const keyInput = screen.getByPlaceholderText('Key (e.g., Model)');
      const valueInput = screen.getByPlaceholderText('Value (comma-separated for lists)');
      const addButton = screen.getByText('Add');

      fireEvent.change(keyInput, { target: { value: 'tags' } });
      fireEvent.change(valueInput, { target: { value: 'tag1, tag2, tag3' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('equipment_upsert_metadata', {
          p_equipment_id: 'eq-123',
          p_key: 'tags',
          p_value: ['tag1', 'tag2', 'tag3'],
        });
      });
    });

    it('should not add field with empty key or value', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      const addButton = screen.getByText('Add');
      fireEvent.click(addButton);

      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('should allow adding field by pressing Enter', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });
      mockRpc.mockResolvedValue({ data: null, error: null });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      const keyInput = screen.getByPlaceholderText('Key (e.g., Model)');
      const valueInput = screen.getByPlaceholderText('Value (comma-separated for lists)');

      fireEvent.change(keyInput, { target: { value: 'test_key' } });
      fireEvent.change(valueInput, { target: { value: 'test_value' } });
      fireEvent.keyDown(valueInput, { key: 'Enter' });

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('equipment_upsert_metadata', {
          p_equipment_id: 'eq-123',
          p_key: 'test_key',
          p_value: 'test_value',
        });
      });
    });

    it('should handle metadata upsert error', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      const keyInput = screen.getByPlaceholderText('Key (e.g., Model)');
      const valueInput = screen.getByPlaceholderText('Value (comma-separated for lists)');
      const addButton = screen.getByText('Add');

      fireEvent.change(keyInput, { target: { value: 'error_field' } });
      fireEvent.change(valueInput, { target: { value: 'error_value' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to add field. Please try again.');
      });

      consoleErrorSpy.mockRestore();
      alertSpy.mockRestore();
    });
  });

  describe('Photo Upload', () => {
    it('should render PhotoUpload component', async () => {
      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });
    });

    it('should clear cache and refetch when photo is uploaded', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      const initialCallCount = mockFrom.mock.calls.length;

      const uploadButton = screen.getByText('Upload Photo');
      fireEvent.click(uploadButton);

      await waitFor(() => {
        expect(mockClearCache).toHaveBeenCalled();
        expect(mockFrom.mock.calls.length).toBeGreaterThan(initialCallCount);
      });
    });
  });

  describe('Tabs', () => {
    it('should render EquipmentTabs component', async () => {
      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('equipment-tabs')).toBeInTheDocument();
      });
    });

    it('should render summary tab by default', async () => {
      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('summary-tab')).toBeInTheDocument();
      });
    });

    it('should display equipment summary in summary tab', async () => {
      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Summary: Test summary')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('should detect mobile viewport', async () => {
      // Mock matchMedia to simulate mobile
      const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(max-width: 1023.98px)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 1023.98px)');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle equipment with no metadata', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'equipment_details') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...mockEquipmentData, metadata: {} },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'equipment') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { summary: 'Test summary' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'attachments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('meta-facts')).toBeInTheDocument();
      });
    });

    it('should handle equipment with null summary', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'equipment_details') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockEquipmentData,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'equipment') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { summary: null },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'attachments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText(/Summary:/)).toBeInTheDocument();
      });
    });

    it('should handle no attachments', async () => {
      mockFrom.mockImplementation((table: string) => {
        if (table === 'equipment_details') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockEquipmentData,
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'equipment') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { summary: 'Test summary' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'attachments') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('photo-upload')).toBeInTheDocument();
      });
    });

    it('should handle signed URL creation error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockStorage.mockReturnValue({
        createSignedUrls: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage error' },
        }),
      });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'createSignedUrls error:',
          'Storage error'
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should trim whitespace from field keys and values', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });
      mockRpc.mockResolvedValue({ data: null, error: null });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      const keyInput = screen.getByPlaceholderText('Key (e.g., Model)');
      const valueInput = screen.getByPlaceholderText('Value (comma-separated for lists)');
      const addButton = screen.getByText('Add');

      fireEvent.change(keyInput, { target: { value: '  trimmed_key  ' } });
      fireEvent.change(valueInput, { target: { value: '  trimmed_value  ' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('equipment_upsert_metadata', {
          p_equipment_id: 'eq-123',
          p_key: 'trimmed_key',
          p_value: 'trimmed_value',
        });
      });
    });

    it('should filter empty strings from comma-separated arrays', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });
      mockRpc.mockResolvedValue({ data: null, error: null });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      const keyInput = screen.getByPlaceholderText('Key (e.g., Model)');
      const valueInput = screen.getByPlaceholderText('Value (comma-separated for lists)');
      const addButton = screen.getByText('Add');

      fireEvent.change(keyInput, { target: { value: 'tags' } });
      fireEvent.change(valueInput, { target: { value: 'tag1, , tag2,  ,tag3' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith('equipment_upsert_metadata', {
          p_equipment_id: 'eq-123',
          p_key: 'tags',
          p_value: ['tag1', 'tag2', 'tag3'],
        });
      });
    });

    it('should clear form after adding field', async () => {
      mockUseRole.mockReturnValue({ isAdmin: true, loading: false });
      mockRpc.mockResolvedValue({ data: null, error: null });

      renderWithRouter(<EquipmentDetails />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      const keyInput = screen.getByPlaceholderText('Key (e.g., Model)') as HTMLInputElement;
      const valueInput = screen.getByPlaceholderText('Value (comma-separated for lists)') as HTMLInputElement;
      const addButton = screen.getByText('Add');

      fireEvent.change(keyInput, { target: { value: 'test_key' } });
      fireEvent.change(valueInput, { target: { value: 'test_value' } });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(keyInput.value).toBe('');
        expect(valueInput.value).toBe('');
      });
    });
  });
});
