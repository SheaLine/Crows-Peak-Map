import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LogsTab from '@/components/Details/LogsTab';

// Mock supabase
const mockRange = vi.fn();
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

// Mock useDataCache
const mockGetCachedData = vi.fn();
const mockSetCachedData = vi.fn();
const mockClearCache = vi.fn();

vi.mock('@/utils/cache', () => ({
  useDataCache: () => ({
    getCachedData: mockGetCachedData,
    setCachedData: mockSetCachedData,
    clearCache: mockClearCache,
  }),
}));

// Mock window.confirm and window.alert
global.confirm = vi.fn();
global.alert = vi.fn();

describe('LogsTab Component', () => {
  const defaultProps = {
    equipmentId: 'equipment-123',
    editMode: false,
    isAdmin: true,
  };

  const mockLogs = [
    {
      id: 'log-1',
      equipment_id: 'equipment-123',
      title: 'Oil Change',
      body: 'Changed oil and filter',
      happened_at: '2024-01-15T10:00:00Z',
      created_by: 'user-1',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'log-2',
      equipment_id: 'equipment-123',
      title: 'Tire Rotation',
      body: 'Rotated all tires',
      happened_at: '2024-01-10T14:30:00Z',
      created_by: 'user-2',
      created_at: '2024-01-10T14:30:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCachedData.mockReturnValue(null);
    (global.confirm as any).mockReturnValue(false);
    (global.alert as any).mockImplementation(() => {});

    // Setup default mock chain for fetching logs
    mockRange.mockReturnValue(Promise.resolve({ data: mockLogs, error: null }));
    mockOrder.mockReturnValue({ range: mockRange });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });

    // Setup mock chain for insert
    mockInsert.mockReturnValue(Promise.resolve({ data: null, error: null }));

    // Setup mock chain for delete
    mockDelete.mockReturnValue(Promise.resolve({ data: null, error: null }));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'service_logs') {
        return {
          select: mockSelect,
          insert: mockInsert,
          delete: mockDelete,
        };
      }
      return {};
    });

    // Setup auth mock
    mockGetUser.mockResolvedValue({
      data: {
        user: { id: 'user-1', email: 'test@example.com' },
      },
      error: null,
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      mockRange.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { container } = render(<LogsTab {...defaultProps} />);

      const spinner = container.querySelector('.loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      const { container } = render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        const spinner = container.querySelector('.loading-spinner');
        expect(spinner).not.toBeInTheDocument();
      });
    });
  });

  describe('Log Display', () => {
    it('should render service logs header', async () => {
      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Service Logs')).toBeInTheDocument();
      });
    });

    it('should display logs when loaded', async () => {
      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Oil Change')).toBeInTheDocument();
        expect(screen.getByText('Tire Rotation')).toBeInTheDocument();
      });
    });

    it('should display log bodies', async () => {
      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Changed oil and filter')).toBeInTheDocument();
        expect(screen.getByText('Rotated all tires')).toBeInTheDocument();
      });
    });

    it('should fetch logs on mount', async () => {
      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('service_logs');
        expect(mockSelect).toHaveBeenCalledWith('*');
        expect(mockEq).toHaveBeenCalledWith('equipment_id', 'equipment-123');
        expect(mockOrder).toHaveBeenCalledWith('happened_at', { ascending: false });
        expect(mockRange).toHaveBeenCalledWith(0, 9); // First page 0-9
      });
    });

    it('should show empty state when no logs', async () => {
      mockRange.mockReturnValue(Promise.resolve({ data: [], error: null }));

      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No service logs yet')).toBeInTheDocument();
      });
    });

    it('should show admin hint in empty state when user is admin', async () => {
      mockRange.mockReturnValue(Promise.resolve({ data: [], error: null }));

      render(<LogsTab {...defaultProps} isAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText('Click "Add Log" to create the first entry')).toBeInTheDocument();
      });
    });

    it('should not show admin hint when user is not admin', async () => {
      mockRange.mockReturnValue(Promise.resolve({ data: [], error: null }));

      render(<LogsTab {...defaultProps} isAdmin={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Click "Add Log" to create the first entry')).not.toBeInTheDocument();
      });
    });

    it('should format dates correctly', async () => {
      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
        expect(screen.getByText('Jan 10, 2024')).toBeInTheDocument();
      });
    });
  });

  describe('Add Log Button', () => {
    it('should show "Add Log" button when user is admin', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText('Add Log')).toBeInTheDocument();
      });
    });

    it('should not show "Add Log" button when user is not admin', async () => {
      render(<LogsTab {...defaultProps} isAdmin={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Add Log')).not.toBeInTheDocument();
      });
    });

    it('should open modal when "Add Log" is clicked', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      await waitFor(() => {
        const addButton = screen.getByText('Add Log');
        fireEvent.click(addButton);
      });

      expect(screen.getByText('Add Service Log')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., Annual maintenance')).toBeInTheDocument();
    });
  });

  describe('Add Log Modal', () => {
    it('should render modal with all form fields', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Add Log'));
      });

      expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Date/)).toBeInTheDocument();
      expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    });

    it('should have default date set to today', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      await waitFor(() => {
        const addButton = screen.getAllByText('Add Log')[0];
        fireEvent.click(addButton);
      });

      const dateInput = screen.getByLabelText(/Date/) as HTMLInputElement;
      const today = new Date().toISOString().split('T')[0];
      expect(dateInput.value).toBe(today);
    });

    it('should update title field when user types', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load
      await screen.findByText('Oil Change');

      // Open modal
      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal and get title input
      const titleInput = await screen.findByPlaceholderText('e.g., Annual maintenance') as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'New Service' } });

      expect(titleInput.value).toBe('New Service');
    });

    it('should update date field when user changes it', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load
      await screen.findByText('Oil Change');

      // Open modal
      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal and get date input
      const dateInput = await screen.findByLabelText(/Date/) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2024-06-15' } });

      expect(dateInput.value).toBe('2024-06-15');
    });

    it('should update body field when user types', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load
      await screen.findByText('Oil Change');

      // Open modal
      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal and get body input
      const bodyInput = await screen.findByPlaceholderText('Detailed notes about the service...') as HTMLTextAreaElement;
      fireEvent.change(bodyInput, { target: { value: 'Service details here' } });

      expect(bodyInput.value).toBe('Service details here');
    });

    it('should close modal when Cancel is clicked', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Add Log'));
      });

      expect(screen.getByText('Add Service Log')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Add Service Log')).not.toBeInTheDocument();
      });
    });

    it.skip('should close modal when clicking outside', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Add Log'));
      });

      expect(screen.getByText('Add Service Log')).toBeInTheDocument();

      const overlay = screen.getByText('Add Service Log').closest('.fixed');
      if (overlay) {
        fireEvent.click(overlay);
        await waitFor(() => {
          expect(screen.queryByText('Add Service Log')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Add Log Validation', () => {
    it('should require title before submitting', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load before opening modal
      await screen.findByText('Oil Change');

      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal to open and get form
      const saveButton = await screen.findByText('Save');
      const form = saveButton.closest('form');

      // Submit form (triggers onSubmit handler)
      if (form) {
        fireEvent.submit(form);
      }

      expect(global.alert).toHaveBeenCalledWith('Please enter a title');
      expect(mockInsert).not.toHaveBeenCalled();
    });

    it.skip('should allow submission with only title (body optional)', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load
      await screen.findByText('Oil Change');

      // Setup insert mock after component loads
      mockInsert.mockReturnValue(Promise.resolve({ data: [{ id: 'new-log' }], error: null }));

      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal and fill title
      const titleInput = await screen.findByPlaceholderText('e.g., Annual maintenance');
      fireEvent.change(titleInput, { target: { value: 'Quick Service' } });

      // Wait for Save button and get form
      const saveButton = await screen.findByText('Save');
      const form = saveButton.closest('form');

      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalled();
      });
    });

    it.skip('should trim whitespace from title before validating', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load
      await screen.findByText('Oil Change');

      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal and fill with whitespace
      const titleInput = await screen.findByPlaceholderText('e.g., Annual maintenance');
      fireEvent.change(titleInput, { target: { value: '   ' } });

      // Wait for Save button and get form
      const saveButton = await screen.findByText('Save');
      const form = saveButton.closest('form');

      if (form) {
        fireEvent.submit(form);
      }

      expect(global.alert).toHaveBeenCalledWith('Please enter a title');
    });
  });

  describe('Add Log Submission', () => {
    it.skip('should submit log with correct data', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load
      await screen.findByText('Oil Change');

      // Setup insert mock after component loads
      mockInsert.mockReturnValue(Promise.resolve({ data: [{ id: 'new-log' }], error: null }));

      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal and fill form
      const titleInput = await screen.findByPlaceholderText('e.g., Annual maintenance');
      const dateInput = screen.getByLabelText(/Date/) as HTMLInputElement;
      const bodyInput = screen.getByPlaceholderText('Detailed notes about the service...');

      fireEvent.change(titleInput, { target: { value: 'Brake Service' } });
      fireEvent.change(dateInput, { target: { value: '2024-03-20' } });
      fireEvent.change(bodyInput, { target: { value: 'Replaced brake pads' } });

      // Wait for Save button and get form
      const saveButton = await screen.findByText('Save');
      const form = saveButton.closest('form');

      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            equipment_id: 'equipment-123',
            title: 'Brake Service',
            body: 'Replaced brake pads',
            created_by: 'user-1',
          }),
        ]);
      });
    });

    it.skip('should close modal after successful submission', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load
      await screen.findByText('Oil Change');

      // Setup insert mock after component loads
      mockInsert.mockReturnValue(Promise.resolve({ data: [{ id: 'new-log' }], error: null }));

      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal and fill title
      const titleInput = await screen.findByPlaceholderText('e.g., Annual maintenance');
      fireEvent.change(titleInput, { target: { value: 'New Service' } });

      // Wait for Save button and get form
      const saveButton = await screen.findByText('Save');
      const form = saveButton.closest('form');

      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.queryByText('Add Service Log')).not.toBeInTheDocument();
      });
    });

    it.skip('should reset form after successful submission', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load
      await screen.findByText('Oil Change');

      // Setup insert mock after component loads
      mockInsert.mockReturnValue(Promise.resolve({ data: [{ id: 'new-log' }], error: null }));

      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal and fill title
      const titleInput = (await screen.findByPlaceholderText('e.g., Annual maintenance')) as HTMLInputElement;
      fireEvent.change(titleInput, { target: { value: 'Service 1' } });

      // Wait for Save button and get form
      const saveButton = await screen.findByText('Save');
      const form = saveButton.closest('form');

      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(screen.queryByText('Add Service Log')).not.toBeInTheDocument();
      });

      // Open modal again and verify form is reset
      fireEvent.click(screen.getAllByText('Add Log')[0]);

      await waitFor(() => {
        const newTitleInput = screen.getByPlaceholderText('e.g., Annual maintenance') as HTMLInputElement;
        expect(newTitleInput.value).toBe('');
      });
    });

    it('should refresh logs after successful submission', async () => {
      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load
      await screen.findByText('Oil Change');

      // Setup insert mock after component loads
      mockInsert.mockReturnValue(Promise.resolve({ data: [{ id: 'new-log' }], error: null }));

      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal and fill title
      const titleInput = await screen.findByPlaceholderText('e.g., Annual maintenance');
      fireEvent.change(titleInput, { target: { value: 'New Service' } });

      vi.clearAllMocks();

      // Wait for Save button and get form
      const saveButton = await screen.findByText('Save');
      const form = saveButton.closest('form');

      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('service_logs');
        expect(mockSelect).toHaveBeenCalled();
      });
    });

    it.skip('should handle submission errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load
      await screen.findByText('Oil Change');

      // Setup insert mock for error after component loads
      mockInsert.mockReturnValue(Promise.resolve({ data: null, error: { message: 'Database error' } }));

      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal and fill title
      const titleInput = await screen.findByPlaceholderText('e.g., Annual maintenance');
      fireEvent.change(titleInput, { target: { value: 'Service' } });

      // Wait for Save button and get form
      const saveButton = await screen.findByText('Save');
      const form = saveButton.closest('form');

      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to add log. Please try again.');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it.skip('should not close modal when submission fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<LogsTab {...defaultProps} isAdmin={true} />);

      // Wait for logs to load
      await screen.findByText('Oil Change');

      // Setup insert mock for error after component loads
      mockInsert.mockReturnValue(Promise.resolve({ data: null, error: { message: 'Database error' } }));

      fireEvent.click(screen.getAllByText('Add Log')[0]);

      // Wait for modal and fill title
      const titleInput = await screen.findByPlaceholderText('e.g., Annual maintenance');
      fireEvent.change(titleInput, { target: { value: 'Service' } });

      // Wait for Save button and get form
      const saveButton = await screen.findByText('Save');
      const form = saveButton.closest('form');

      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });

      // Modal should still be visible
      expect(screen.getByText('Add Service Log')).toBeInTheDocument();
    });
  });

  describe('Delete Log', () => {
    it('should show delete button in edit mode when user is admin', async () => {
      render(<LogsTab {...defaultProps} editMode={true} isAdmin={true} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete log');
        expect(deleteButtons.length).toBeGreaterThan(0);
      });
    });

    it('should not show delete button when not in edit mode', async () => {
      render(<LogsTab {...defaultProps} editMode={false} isAdmin={true} />);

      await waitFor(() => {
        expect(screen.queryByLabelText('Delete log')).not.toBeInTheDocument();
      });
    });

    it('should not show delete button when user is not admin', async () => {
      render(<LogsTab {...defaultProps} editMode={true} isAdmin={false} />);

      await waitFor(() => {
        expect(screen.queryByLabelText('Delete log')).not.toBeInTheDocument();
      });
    });

    it('should show confirmation dialog when delete is clicked', async () => {
      render(<LogsTab {...defaultProps} editMode={true} isAdmin={true} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete log');
        fireEvent.click(deleteButtons[0]);
      });

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete the log "Oil Change"?');
    });

    it('should not delete when user cancels confirmation', async () => {
      (global.confirm as any).mockReturnValue(false);

      render(<LogsTab {...defaultProps} editMode={true} isAdmin={true} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete log');
        fireEvent.click(deleteButtons[0]);
      });

      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should delete log when user confirms', async () => {
      (global.confirm as any).mockReturnValue(true);
      mockDelete.mockReturnValue(Promise.resolve({ data: null, error: null }));

      render(<LogsTab {...defaultProps} editMode={true} isAdmin={true} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete log');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('service_logs');
        expect(mockDelete).toHaveBeenCalled();
      });
    });

    it.skip('should refresh logs after successful deletion', async () => {
      (global.confirm as any).mockReturnValue(true);
      mockDelete.mockReturnValue(Promise.resolve({ data: null, error: null }));

      render(<LogsTab {...defaultProps} editMode={true} isAdmin={true} />);

      await waitFor(() => {
        expect(screen.getByText('Oil Change')).toBeInTheDocument();
      });

      vi.clearAllMocks();
      mockRange.mockReturnValue(Promise.resolve({ data: [mockLogs[1]], error: null }));

      const deleteButtons = screen.getAllByLabelText('Delete log');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockSelect).toHaveBeenCalled();
      });
    });

    it('should handle deletion errors gracefully', async () => {
      (global.confirm as any).mockReturnValue(true);
      mockDelete.mockReturnValue(Promise.resolve({ data: null, error: { message: 'Database error' } }));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<LogsTab {...defaultProps} editMode={true} isAdmin={true} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete log');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to delete log. Please try again.');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Load More Pagination', () => {
    it('should show "Load More" button when there are more logs', async () => {
      const tenLogs = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        equipment_id: 'equipment-123',
        title: `Service ${i}`,
        body: `Details ${i}`,
        happened_at: '2024-01-15T10:00:00Z',
        created_by: 'user-1',
        created_at: '2024-01-15T10:00:00Z',
      }));
      mockRange.mockReturnValue(Promise.resolve({ data: tenLogs, error: null }));

      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });
    });

    it('should not show "Load More" when fewer than 10 logs', async () => {
      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Load More')).not.toBeInTheDocument();
      });
    });

    it.skip('should fetch next page when "Load More" is clicked', async () => {
      const tenLogs = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        equipment_id: 'equipment-123',
        title: `Service ${i}`,
        body: `Details ${i}`,
        happened_at: '2024-01-15T10:00:00Z',
        created_by: 'user-1',
        created_at: '2024-01-15T10:00:00Z',
      }));
      mockRange.mockReturnValueOnce(Promise.resolve({ data: tenLogs, error: null }));

      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });

      vi.clearAllMocks();
      mockRange.mockReturnValueOnce(Promise.resolve({ data: [], error: null }));

      const loadMoreButton = screen.getByText('Load More');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(mockRange).toHaveBeenCalledWith(10, 19); // Second page 10-19
      });
    });

    it.skip('should show loading state while loading more', async () => {
      const tenLogs = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        equipment_id: 'equipment-123',
        title: `Service ${i}`,
        body: `Details ${i}`,
        happened_at: '2024-01-15T10:00:00Z',
        created_by: 'user-1',
        created_at: '2024-01-15T10:00:00Z',
      }));
      mockRange.mockReturnValue(Promise.resolve({ data: tenLogs, error: null }));

      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });

      mockRange.mockImplementation(() => new Promise(() => {})); // Never resolves

      const loadMoreButton = screen.getByText('Load More');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it.skip('should append new logs to existing list', async () => {
      const firstPage = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        equipment_id: 'equipment-123',
        title: `Service ${i}`,
        body: `Details ${i}`,
        happened_at: '2024-01-15T10:00:00Z',
        created_by: 'user-1',
        created_at: '2024-01-15T10:00:00Z',
      }));
      const secondPage = Array.from({ length: 5 }, (_, i) => ({
        id: `log-${i + 10}`,
        equipment_id: 'equipment-123',
        title: `Service ${i + 10}`,
        body: `Details ${i + 10}`,
        happened_at: '2024-01-15T10:00:00Z',
        created_by: 'user-1',
        created_at: '2024-01-15T10:00:00Z',
      }));

      mockRange.mockReturnValueOnce(Promise.resolve({ data: firstPage, error: null }));

      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Service 0')).toBeInTheDocument();
      });

      mockRange.mockReturnValueOnce(Promise.resolve({ data: secondPage, error: null }));

      const loadMoreButton = screen.getByText('Load More');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.getByText('Service 10')).toBeInTheDocument();
        expect(screen.getByText('Service 0')).toBeInTheDocument(); // Old logs still there
      });
    });

    it.skip('should hide "Load More" when no more logs available', async () => {
      const tenLogs = Array.from({ length: 10 }, (_, i) => ({
        id: `log-${i}`,
        equipment_id: 'equipment-123',
        title: `Service ${i}`,
        body: `Details ${i}`,
        happened_at: '2024-01-15T10:00:00Z',
        created_by: 'user-1',
        created_at: '2024-01-15T10:00:00Z',
      }));
      mockRange.mockReturnValueOnce(Promise.resolve({ data: tenLogs, error: null }));

      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument();
      });

      mockRange.mockReturnValueOnce(Promise.resolve({ data: [], error: null }));

      const loadMoreButton = screen.getByText('Load More');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(screen.queryByText('Load More')).not.toBeInTheDocument();
      });
    });
  });

  describe('Cache Integration', () => {
    it('should use cached logs when available', () => {
      const cachedLogs = [
        {
          id: 'cached-1',
          equipment_id: 'equipment-123',
          title: 'Cached Log',
          body: 'From cache',
          happened_at: '2024-01-01T10:00:00Z',
          created_by: 'user-1',
          created_at: '2024-01-01T10:00:00Z',
        },
      ];
      mockGetCachedData.mockReturnValue(cachedLogs);

      render(<LogsTab {...defaultProps} />);

      expect(screen.getByText('Cached Log')).toBeInTheDocument();
      expect(screen.getByText('From cache')).toBeInTheDocument();
    });

    it('should cache first page of logs after fetching', async () => {
      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(mockSetCachedData).toHaveBeenCalledWith(mockLogs);
      });
    });

    it('should reset logs when equipmentId changes', async () => {
      const { rerender } = render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Oil Change')).toBeInTheDocument();
      });

      const newLogs = [
        {
          id: 'new-log',
          equipment_id: 'equipment-456',
          title: 'Different Equipment Log',
          body: 'New equipment service',
          happened_at: '2024-02-01T10:00:00Z',
          created_by: 'user-1',
          created_at: '2024-02-01T10:00:00Z',
        },
      ];
      mockRange.mockReturnValue(Promise.resolve({ data: newLogs, error: null }));

      rerender(<LogsTab {...defaultProps} equipmentId="equipment-456" />);

      await waitFor(() => {
        expect(screen.getByText('Different Equipment Log')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockRange.mockReturnValue(Promise.resolve({ data: null, error: { message: 'Fetch error' } }));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should show empty state when fetch fails', async () => {
      mockRange.mockReturnValue(Promise.resolve({ data: null, error: { message: 'Fetch error' } }));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<LogsTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No service logs yet')).toBeInTheDocument();
      });
    });
  });
});
