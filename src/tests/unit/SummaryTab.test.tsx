import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SummaryTab from '@/components/Details/SummaryTab';

// Mock supabase
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
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

// Mock window.alert
global.alert = vi.fn();

describe('SummaryTab Component', () => {
  const defaultProps = {
    equipmentId: 'equipment-123',
    initialSummary: 'This is a test summary',
    isAdmin: true,
    editMode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCachedData.mockReturnValue(null);

    // Setup default mock chain
    mockEq.mockReturnValue({
      data: null,
      error: null,
    });
    mockUpdate.mockReturnValue({
      eq: mockEq,
    });
    mockFrom.mockReturnValue({
      update: mockUpdate,
    });
  });

  describe('Display Mode', () => {
    it('should render summary header', () => {
      render(<SummaryTab {...defaultProps} />);

      expect(screen.getByText('Summary')).toBeInTheDocument();
    });

    it('should display summary text in view mode', () => {
      render(<SummaryTab {...defaultProps} />);

      expect(screen.getByText('This is a test summary')).toBeInTheDocument();
    });

    it('should show "No summary available" when summary is empty', () => {
      render(<SummaryTab {...defaultProps} initialSummary={null} />);

      expect(screen.getByText('No summary available')).toBeInTheDocument();
    });

    it('should show "No summary available" when summary is empty string', () => {
      render(<SummaryTab {...defaultProps} initialSummary="" />);

      expect(screen.getByText('No summary available')).toBeInTheDocument();
    });

    it('should show "No summary available" when summary is whitespace only', () => {
      render(<SummaryTab {...defaultProps} initialSummary="   " />);

      expect(screen.getByText('No summary available')).toBeInTheDocument();
    });

    it('should show admin hint when no summary and user is admin', () => {
      render(<SummaryTab {...defaultProps} initialSummary={null} isAdmin={true} />);

      expect(screen.getByText('Enter edit mode to add a summary')).toBeInTheDocument();
    });

    it('should not show admin hint when no summary and user is not admin', () => {
      render(<SummaryTab {...defaultProps} initialSummary={null} isAdmin={false} />);

      expect(screen.queryByText('Enter edit mode to add a summary')).not.toBeInTheDocument();
    });

    it('should not show save button in view mode', () => {
      render(<SummaryTab {...defaultProps} editMode={false} />);

      expect(screen.queryByText('Save Summary')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should show textarea in edit mode when user is admin', () => {
      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      const textarea = screen.getByPlaceholderText('Enter a detailed summary of this equipment...');
      expect(textarea).toBeInTheDocument();
      expect((textarea as HTMLTextAreaElement).value).toBe('This is a test summary');
    });

    it('should not show textarea when user is not admin', () => {
      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={false} />);

      expect(screen.queryByPlaceholderText('Enter a detailed summary of this equipment...')).not.toBeInTheDocument();
    });

    it('should show save button in edit mode when user is admin', () => {
      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      expect(screen.getByText('Save Summary')).toBeInTheDocument();
    });

    it('should not show save button when user is not admin', () => {
      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={false} />);

      expect(screen.queryByText('Save Summary')).not.toBeInTheDocument();
    });

    it('should update textarea value when user types', () => {
      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      const textarea = screen.getByPlaceholderText('Enter a detailed summary of this equipment...') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Updated summary text' } });

      expect(textarea.value).toBe('Updated summary text');
    });

    it('should show save instructions in edit mode', () => {
      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      expect(screen.getByText('Click "Save Summary" to save your changes')).toBeInTheDocument();
    });
  });

  describe('Saving Functionality', () => {
    it('should save summary when save button is clicked', async () => {
      mockEq.mockResolvedValue({ data: {}, error: null });

      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      const textarea = screen.getByPlaceholderText('Enter a detailed summary of this equipment...') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'New summary' } });

      const saveButton = screen.getByText('Save Summary');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('equipment');
        expect(mockUpdate).toHaveBeenCalledWith({ summary: 'New summary' });
        expect(mockEq).toHaveBeenCalledWith('id', 'equipment-123');
      });
    });

    it('should trim whitespace when saving', async () => {
      mockEq.mockResolvedValue({ data: {}, error: null });

      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      const textarea = screen.getByPlaceholderText('Enter a detailed summary of this equipment...') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: '  New summary with spaces  ' } });

      const saveButton = screen.getByText('Save Summary');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ summary: 'New summary with spaces' });
      });
    });

    it('should save empty summary as null when all whitespace', async () => {
      mockEq.mockResolvedValue({ data: {}, error: null });

      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      const textarea = screen.getByPlaceholderText('Enter a detailed summary of this equipment...') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: '   ' } });

      const saveButton = screen.getByText('Save Summary');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ summary: null });
      });
    });

    it('should show saving state while saving', async () => {
      // Make the save operation take time
      mockEq.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 100)));

      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      const saveButton = screen.getByText('Save Summary');
      fireEvent.click(saveButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(saveButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
      });
    });

    it('should show last saved timestamp after successful save', async () => {
      mockEq.mockResolvedValue({ data: {}, error: null });

      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      const saveButton = screen.getByText('Save Summary');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Last saved:/)).toBeInTheDocument();
      });
    });

    it('should update cache after successful save', async () => {
      mockEq.mockResolvedValue({ data: {}, error: null });

      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      const textarea = screen.getByPlaceholderText('Enter a detailed summary of this equipment...') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'Cached summary' } });

      const saveButton = screen.getByText('Save Summary');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockSetCachedData).toHaveBeenCalledWith('Cached summary');
      });
    });

    it('should call onSummaryUpdate callback after successful save', async () => {
      mockEq.mockResolvedValue({ data: {}, error: null });
      const onSummaryUpdate = vi.fn();

      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} onSummaryUpdate={onSummaryUpdate} />);

      const saveButton = screen.getByText('Save Summary');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(onSummaryUpdate).toHaveBeenCalled();
      });
    });

    it('should handle save errors gracefully', async () => {
      mockEq.mockResolvedValue({ data: null, error: { message: 'Database error' } });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      const saveButton = screen.getByText('Save Summary');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to save summary. Please try again.');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not update cache when save fails', async () => {
      mockEq.mockResolvedValue({ data: null, error: { message: 'Database error' } });
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      const saveButton = screen.getByText('Save Summary');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });

      expect(mockSetCachedData).not.toHaveBeenCalled();
    });

    it('should not call onSummaryUpdate when save fails', async () => {
      mockEq.mockResolvedValue({ data: null, error: { message: 'Database error' } });
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const onSummaryUpdate = vi.fn();

      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} onSummaryUpdate={onSummaryUpdate} />);

      const saveButton = screen.getByText('Save Summary');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalled();
      });

      expect(onSummaryUpdate).not.toHaveBeenCalled();
    });
  });

  describe('Cache Integration', () => {
    it('should use cached summary when available', () => {
      mockGetCachedData.mockReturnValue('Cached summary from storage');

      render(<SummaryTab {...defaultProps} initialSummary="Initial summary" />);

      const textarea = screen.queryByPlaceholderText('Enter a detailed summary of this equipment...');
      if (textarea) {
        expect((textarea as HTMLTextAreaElement).value).toBe('Cached summary from storage');
      } else {
        // In view mode, check the displayed text
        expect(screen.getByText('Cached summary from storage')).toBeInTheDocument();
      }
    });

    it('should use initialSummary when cache is empty', () => {
      mockGetCachedData.mockReturnValue(null);

      render(<SummaryTab {...defaultProps} initialSummary="Initial summary" />);

      expect(screen.getByText('Initial summary')).toBeInTheDocument();
    });

    it('should reset summary when equipmentId changes', () => {
      mockGetCachedData.mockReturnValue(null);

      const { rerender } = render(<SummaryTab {...defaultProps} initialSummary="Summary 1" />);

      expect(screen.getByText('Summary 1')).toBeInTheDocument();

      // Change equipment ID
      rerender(<SummaryTab {...defaultProps} equipmentId="equipment-456" initialSummary="Summary 2" />);

      expect(screen.getByText('Summary 2')).toBeInTheDocument();
    });
  });

  describe('Textarea Properties', () => {
    it('should have 12 rows in textarea', () => {
      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} />);

      const textarea = screen.getByPlaceholderText('Enter a detailed summary of this equipment...') as HTMLTextAreaElement;
      expect(textarea.rows).toBe(12);
    });

    it('should have proper placeholder text', () => {
      render(<SummaryTab {...defaultProps} editMode={true} isAdmin={true} initialSummary="" />);

      expect(screen.getByPlaceholderText('Enter a detailed summary of this equipment...')).toBeInTheDocument();
    });
  });
});
