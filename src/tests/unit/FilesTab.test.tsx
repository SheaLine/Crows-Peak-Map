import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FilesTab from '@/components/Details/FilesTab';

// Mock UUID
vi.mock('uuid', () => ({
  v4: () => 'test-uuid-1234',
}));

// Mock supabase
const mockOrder = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockCreateSignedUrl = vi.fn();

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    storage: {
      from: () => ({
        upload: mockUpload,
        remove: mockRemove,
        createSignedUrl: mockCreateSignedUrl,
      }),
    },
  },
}));

// Mock useStorageCache
const mockGetCachedUrls = vi.fn();
const mockSetCachedUrls = vi.fn();
const mockClearCache = vi.fn();

vi.mock('@/utils/cache', () => ({
  useStorageCache: () => ({
    getCachedUrls: mockGetCachedUrls,
    setCachedUrls: mockSetCachedUrls,
    clearCache: mockClearCache,
  }),
}));

// Mock window.open and window.confirm
global.open = vi.fn();
global.confirm = vi.fn();
global.alert = vi.fn();

describe('FilesTab Component', () => {
  const defaultProps = {
    equipmentId: 'equipment-123',
    isAdmin: true,
    editMode: false,
  };

  const mockFiles = [
    {
      id: 'file-1',
      equipment_id: 'equipment-123',
      url: 'equipment/equipment-123/doc1.pdf',
      file_type: 'application/pdf',
      label: 'Manual.pdf',
      is_primary: false,
      file_size: 1048576, // 1 MB
      uploaded_at: '2024-01-15T10:00:00Z',
      is_image: false,
    },
    {
      id: 'file-2',
      equipment_id: 'equipment-123',
      url: 'equipment/equipment-123/doc2.docx',
      file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      label: 'Report.docx',
      is_primary: false,
      file_size: 512000, // 500 KB
      uploaded_at: '2024-01-10T14:30:00Z',
      is_image: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCachedUrls.mockReturnValue(null);
    (global.confirm as any).mockReturnValue(false);
    (global.alert as any).mockImplementation(() => {});

    // Setup default mock chain for fetching files
    mockOrder.mockReturnValue(Promise.resolve({ data: mockFiles, error: null }));
    const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
    mockEq.mockReturnValue({ eq: mockEq2 });
    mockSelect.mockReturnValue({ eq: mockEq });

    // Setup mock chain for insert
    mockInsert.mockReturnValue(Promise.resolve({ data: null, error: null }));

    // Setup mock chain for delete (must return object with .eq())
    const mockDeleteEq = vi.fn().mockReturnValue(Promise.resolve({ data: null, error: null }));
    mockDelete.mockReturnValue({ eq: mockDeleteEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'attachments') {
        return {
          select: mockSelect,
          insert: mockInsert,
          delete: mockDelete,
        };
      }
      return {};
    });

    // Setup storage mocks
    mockUpload.mockResolvedValue({ data: null, error: null });
    mockRemove.mockResolvedValue({ data: null, error: null });
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed-url.com/file.pdf' },
      error: null,
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      mockOrder.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { container } = render(<FilesTab {...defaultProps} />);

      const spinner = container.querySelector('.loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      const { container } = render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        const spinner = container.querySelector('.loading-spinner');
        expect(spinner).not.toBeInTheDocument();
      });
    });
  });

  describe('File Display', () => {
    it('should render files header', async () => {
      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Files')).toBeInTheDocument();
      });
    });

    it('should display files when loaded', async () => {
      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
        expect(screen.getByText('Report.docx')).toBeInTheDocument();
      });
    });

    it('should fetch files on mount', async () => {
      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('attachments');
        expect(mockSelect).toHaveBeenCalledWith('*');
        expect(mockEq).toHaveBeenCalledWith('equipment_id', 'equipment-123');
      });
    });

    it('should show empty state when no files', async () => {
      mockOrder.mockReturnValue(Promise.resolve({ data: [], error: null }));

      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No files yet')).toBeInTheDocument();
      });
    });

    it('should show admin hint in empty state when in edit mode', async () => {
      mockOrder.mockReturnValue(Promise.resolve({ data: [], error: null }));

      render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Click "Upload Files" to add documents')).toBeInTheDocument();
      });
    });

    it('should not show admin hint when not in edit mode', async () => {
      mockOrder.mockReturnValue(Promise.resolve({ data: [], error: null }));

      render(<FilesTab {...defaultProps} isAdmin={true} editMode={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Click "Upload Files" to add documents')).not.toBeInTheDocument();
      });
    });

    it('should format file sizes correctly', async () => {
      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/1.0 MB/)).toBeInTheDocument();
        expect(screen.getByText(/500.0 KB/)).toBeInTheDocument();
      });
    });

    it('should format upload dates correctly', async () => {
      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
        expect(screen.getByText(/Jan 10, 2024/)).toBeInTheDocument();
      });
    });

    it('should show "Unknown size" for null file size', async () => {
      const filesWithNullSize = [
        { ...mockFiles[0], file_size: null },
      ];
      mockOrder.mockReturnValue(Promise.resolve({ data: filesWithNullSize, error: null }));

      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Unknown size/)).toBeInTheDocument();
      });
    });

    it('should show "Unknown date" for null uploaded_at', async () => {
      const filesWithNullDate = [
        { ...mockFiles[0], uploaded_at: null },
      ];
      mockOrder.mockReturnValue(Promise.resolve({ data: filesWithNullDate, error: null }));

      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Unknown date/)).toBeInTheDocument();
      });
    });
  });

  describe('Upload Files Button', () => {
    it('should show upload button when admin and in edit mode', async () => {
      render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Files')).toBeInTheDocument();
      });
    });

    it('should not show upload button when not admin', async () => {
      render(<FilesTab {...defaultProps} isAdmin={false} editMode={true} />);

      await waitFor(() => {
        expect(screen.queryByText('Upload Files')).not.toBeInTheDocument();
      });
    });

    it('should not show upload button when not in edit mode', async () => {
      render(<FilesTab {...defaultProps} isAdmin={true} editMode={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Upload Files')).not.toBeInTheDocument();
      });
    });

    it('should have hidden file input', async () => {
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        const input = container.querySelector('input[type="file"]');
        expect(input).toBeInTheDocument();
        expect(input).toHaveClass('hidden');
      });
    });

    it('should allow multiple file selection', async () => {
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        const input = container.querySelector('input[type="file"]') as HTMLInputElement;
        expect(input?.multiple).toBe(true);
      });
    });
  });

  describe('File Upload', () => {
    it('should upload non-image files', async () => {
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Files')).toBeInTheDocument();
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          'equipment/equipment-123/test-uuid-1234.pdf',
          file,
          { upsert: false }
        );
      });
    });

    it('should skip image files during upload', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Files')).toBeInTheDocument();
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });

      Object.defineProperty(input, 'files', {
        value: [imageFile],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalledWith('Skipping image file: photo.jpg');
      });

      expect(mockUpload).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should insert attachment record after upload', async () => {
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Files')).toBeInTheDocument();
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024, writable: false });

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith({
          equipment_id: 'equipment-123',
          url: 'equipment/equipment-123/test-uuid-1234.pdf',
          file_type: 'application/pdf',
          label: 'document.pdf',
          is_primary: false,
          file_size: 1024,
        });
      });
    });

    it('should show uploading state during upload', async () => {
      mockUpload.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ data: null, error: null }), 100)));

      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Files')).toBeInTheDocument();
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(screen.getByText('Uploading...')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
      }, { timeout: 200 });
    });

    it('should clear cache after successful upload', async () => {
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Files')).toBeInTheDocument();
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockClearCache).toHaveBeenCalled();
      });
    });

    it('should refresh files after upload', async () => {
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Files')).toBeInTheDocument();
      });

      vi.clearAllMocks();

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockSelect).toHaveBeenCalled();
      });
    });

    it('should handle upload errors gracefully', async () => {
      mockUpload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Files')).toBeInTheDocument();
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to upload some files. Please try again.');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should upload multiple files', async () => {
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Files')).toBeInTheDocument();
      });

      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      const file1 = new File(['content1'], 'doc1.pdf', { type: 'application/pdf' });
      const file2 = new File(['content2'], 'doc2.pdf', { type: 'application/pdf' });

      Object.defineProperty(input, 'files', {
        value: [file1, file2],
        writable: false,
      });

      fireEvent.change(input);

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Download File', () => {
    it('should show download button for all files', async () => {
      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        const downloadButtons = screen.getAllByText('Download');
        expect(downloadButtons.length).toBe(2);
      });
    });

    it('should create signed URL when downloading', async () => {
      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByText('Download');
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(mockCreateSignedUrl).toHaveBeenCalledWith('equipment/equipment-123/doc1.pdf', 3600);
      });
    });

    it('should open file in new tab', async () => {
      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByText('Download');
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(global.open).toHaveBeenCalledWith('https://signed-url.com/file.pdf', '_blank');
      });
    });

    it('should use cached URL if available', async () => {
      const cachedUrls = new Map([['equipment/equipment-123/doc1.pdf', 'https://cached-url.com/file.pdf']]);
      mockGetCachedUrls.mockReturnValue(cachedUrls);

      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByText('Download');
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(global.open).toHaveBeenCalledWith('https://cached-url.com/file.pdf', '_blank');
      });

      expect(mockCreateSignedUrl).not.toHaveBeenCalled();
    });

    it('should cache signed URL after creation', async () => {
      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByText('Download');
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(mockSetCachedUrls).toHaveBeenCalledWith(
          new Map([['equipment/equipment-123/doc1.pdf', 'https://signed-url.com/file.pdf']])
        );
      });
    });

    it('should handle download errors gracefully', async () => {
      mockCreateSignedUrl.mockResolvedValue({ data: null, error: { message: 'Failed to create URL' } });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByText('Download');
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to download file. Please try again.');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Delete File', () => {
    it('should show delete button only in edit mode for admins', async () => {
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const deleteButtons = container.querySelectorAll('button[title="Delete"]');
      expect(deleteButtons.length).toBe(2);
    });

    it('should not show delete button when not in edit mode', async () => {
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={false} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const deleteButtons = container.querySelectorAll('button[title="Delete"]');
      expect(deleteButtons.length).toBe(0);
    });

    it('should not show delete button when not admin', async () => {
      const { container } = render(<FilesTab {...defaultProps} isAdmin={false} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const deleteButtons = container.querySelectorAll('button[title="Delete"]');
      expect(deleteButtons.length).toBe(0);
    });

    it('should show confirmation dialog when delete is clicked', async () => {
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const deleteButtons = container.querySelectorAll('button[title="Delete"]');
      fireEvent.click(deleteButtons[0]);

      expect(global.confirm).toHaveBeenCalledWith('Are you sure you want to delete "Manual.pdf"?');
    });

    it('should not delete when user cancels confirmation', async () => {
      (global.confirm as any).mockReturnValue(false);
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const deleteButtons = container.querySelectorAll('button[title="Delete"]');
      fireEvent.click(deleteButtons[0]);

      expect(mockRemove).not.toHaveBeenCalled();
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should delete file from storage when confirmed', async () => {
      (global.confirm as any).mockReturnValue(true);
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const deleteButtons = container.querySelectorAll('button[title="Delete"]');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith(['equipment/equipment-123/doc1.pdf']);
      });
    });

    it('should delete file from database when confirmed', async () => {
      (global.confirm as any).mockReturnValue(true);
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const deleteButtons = container.querySelectorAll('button[title="Delete"]');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockFrom).toHaveBeenCalledWith('attachments');
        expect(mockDelete).toHaveBeenCalled();
      });
    });

    it('should clear cache after successful deletion', async () => {
      (global.confirm as any).mockReturnValue(true);
      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      // Track cache clear calls
      const cacheCallsBefore = mockClearCache.mock.calls.length;

      const deleteButtons = container.querySelectorAll('button[title="Delete"]');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockClearCache.mock.calls.length).toBeGreaterThan(cacheCallsBefore);
      });
    });

    it('should handle deletion errors gracefully', async () => {
      (global.confirm as any).mockReturnValue(true);
      mockRemove.mockResolvedValue({ data: null, error: { message: 'Delete failed' } });
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { container } = render(<FilesTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const deleteButtons = container.querySelectorAll('button[title="Delete"]');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to delete file. Please try again.');
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      mockOrder.mockReturnValue(Promise.resolve({ data: null, error: { message: 'Fetch error' } }));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith('Failed to load files. Please try again.');
      });

      consoleErrorSpy.mockRestore();
    });

    it('should show empty state when fetch fails', async () => {
      mockOrder.mockReturnValue(Promise.resolve({ data: null, error: { message: 'Fetch error' } }));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No files yet')).toBeInTheDocument();
      });
    });
  });

  describe('File Size Formatting', () => {
    it('should format bytes correctly', async () => {
      const filesWithBytes = [
        { ...mockFiles[0], file_size: 512, label: 'Small file' },
      ];
      mockOrder.mockReturnValue(Promise.resolve({ data: filesWithBytes, error: null }));

      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/512 B/)).toBeInTheDocument();
      });
    });

    it('should format kilobytes correctly', async () => {
      const filesWithKB = [
        { ...mockFiles[0], file_size: 2048, label: 'KB file' },
      ];
      mockOrder.mockReturnValue(Promise.resolve({ data: filesWithKB, error: null }));

      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/2.0 KB/)).toBeInTheDocument();
      });
    });

    it('should format megabytes correctly', async () => {
      const filesWithMB = [
        { ...mockFiles[0], file_size: 5242880, label: 'MB file' },
      ];
      mockOrder.mockReturnValue(Promise.resolve({ data: filesWithMB, error: null }));

      render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/5.0 MB/)).toBeInTheDocument();
      });
    });
  });

  describe('File Icons', () => {
    it('should render icons for all files', async () => {
      const { container } = render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Equipment ID Changes', () => {
    it('should refetch files when equipmentId changes', async () => {
      const { rerender } = render(<FilesTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Manual.pdf')).toBeInTheDocument();
      });

      vi.clearAllMocks();
      const newFiles = [
        { ...mockFiles[0], id: 'new-file', equipment_id: 'equipment-456', label: 'New Equipment File' },
      ];
      mockOrder.mockReturnValue(Promise.resolve({ data: newFiles, error: null }));

      rerender(<FilesTab {...defaultProps} equipmentId="equipment-456" />);

      await waitFor(() => {
        expect(mockEq).toHaveBeenCalledWith('equipment_id', 'equipment-456');
      });
    });
  });
});
