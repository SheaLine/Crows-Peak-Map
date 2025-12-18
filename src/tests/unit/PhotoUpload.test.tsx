import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PhotoUpload from '@/components/Details/PhotoUpload';

// Mock UUID
const mockUuid = 'test-uuid-1234';
vi.mock('uuid', () => ({
  v4: () => mockUuid,
}));

// Mock supabase
const mockUpload = vi.fn();
const mockFrom = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockEq = vi.fn();

vi.mock('@/supabaseClient', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
      }),
    },
    from: (...args: any[]) => mockFrom(...args),
  },
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
global.URL.revokeObjectURL = vi.fn();

describe('PhotoUpload Component', () => {
  const defaultProps = {
    equipmentId: 'equipment-123',
    primaryUrl: 'https://example.com/photo.jpg',
    editMode: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock chains
    mockEq.mockReturnValue(Promise.resolve({ data: null, error: null }));
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockInsert.mockReturnValue(Promise.resolve({ data: null, error: null }));

    mockFrom.mockImplementation((table: string) => {
      if (table === 'attachments') {
        return {
          update: mockUpdate,
          insert: mockInsert,
        };
      }
      return {};
    });

    mockUpload.mockResolvedValue({ data: null, error: null });
  });

  describe('Display Mode', () => {
    it('should render primary photo when provided', () => {
      render(<PhotoUpload {...defaultProps} />);

      const img = screen.getByAltText('No photo of equipment uploaded') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('https://example.com/photo.jpg');
    });

    it('should render fallback photo when no primary URL', () => {
      render(<PhotoUpload {...defaultProps} primaryUrl={undefined} />);

      const img = screen.getByAltText('No photo of equipment uploaded') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.src).toContain('/your-photo.jpg');
    });

    it('should not show upload controls in view mode', () => {
      render(<PhotoUpload {...defaultProps} editMode={false} />);

      expect(screen.queryByText('Upload New Photo')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('upload-photo')).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should show upload button in edit mode', () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      expect(screen.getByText('Upload New Photo')).toBeInTheDocument();
    });

    it('should have file input with correct accept types', () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const input = document.getElementById('upload-photo') as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.type).toBe('file');
      expect(input.accept).toBe('image/jpeg,image/png,image/webp,image/heic,image/heif');
    });

    it('should hide file input visually', () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const input = document.getElementById('upload-photo') as HTMLInputElement;
      expect(input.className).toContain('sr-only');
    });
  });

  describe('File Upload', () => {
    it('should upload valid JPEG file', async () => {
      const onUploaded = vi.fn();
      render(<PhotoUpload {...defaultProps} editMode={true} onUploaded={onUploaded} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          `equipment/${defaultProps.equipmentId}/${mockUuid}.jpg`,
          file,
          {
            upsert: false,
            contentType: 'image/jpeg',
            cacheControl: '3600',
          }
        );
      });

      expect(onUploaded).toHaveBeenCalled();
    });

    it('should upload valid PNG file', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.png', { type: 'image/png' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          `equipment/${defaultProps.equipmentId}/${mockUuid}.png`,
          file,
          expect.objectContaining({ contentType: 'image/png' })
        );
      });
    });

    it('should upload valid WebP file', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.webp', { type: 'image/webp' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          expect.stringContaining('.webp'),
          file,
          expect.objectContaining({ contentType: 'image/webp' })
        );
      });
    });

    it('should create preview URL for uploaded file', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);

      // Preview should be shown
      await waitFor(() => {
        const img = screen.getByAltText('Preview') as HTMLImageElement;
        expect(img).toBeInTheDocument();
        expect(img.src).toContain('blob:mock-preview-url');
      });
    });

    it('should set all existing photos to not primary before upload', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ is_primary: false });
        expect(mockEq).toHaveBeenCalledWith('equipment_id', defaultProps.equipmentId);
      });
    });

    it('should insert new attachment as primary photo', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith({
          equipment_id: defaultProps.equipmentId,
          url: `equipment/${defaultProps.equipmentId}/${mockUuid}.jpg`,
          file_type: 'image/jpeg',
          is_primary: true,
        });
      });
    });

    it('should call onUploaded callback after successful upload', async () => {
      const onUploaded = vi.fn();
      render(<PhotoUpload {...defaultProps} editMode={true} onUploaded={onUploaded} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(onUploaded).toHaveBeenCalled();
      });
    });

    it('should reset input value after upload', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });

      expect(input.value).toBe('');
    });
  });

  describe('File Validation', () => {
    it('should reject unsupported file types', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.gif', { type: 'image/gif' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Unsupported file type.')).toBeInTheDocument();
      });

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('should reject files exceeding size limit', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      // Create a file and mock its size property
      const largeFile = new File(['content'], 'large.jpg', { type: 'image/jpeg' });

      Object.defineProperty(largeFile, 'size', {
        value: 1001 * 1024 * 1024, // 1001 MB
        writable: false,
      });

      const input = document.getElementById('upload-photo') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [largeFile] } });

      await waitFor(() => {
        expect(screen.getByText(/File too large/)).toBeInTheDocument();
      });

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('should handle no file selected gracefully', () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const input = document.getElementById('upload-photo') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [] } });

      expect(mockUpload).not.toHaveBeenCalled();
    });

    it('should clear previous errors when selecting new file', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      // First, trigger an error
      const invalidFile = new File(['image'], 'test.gif', { type: 'image/gif' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [invalidFile] } });

      await waitFor(() => {
        expect(screen.getByText('Unsupported file type.')).toBeInTheDocument();
      });

      // Then select a valid file
      const validFile = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      fireEvent.change(input, { target: { files: [validFile] } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Unsupported file type.')).not.toBeInTheDocument();
      });
    });
  });

  describe('Upload States', () => {
    it('should show uploading state during upload', async () => {
      mockUpload.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: null, error: null }), 100))
      );

      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      expect(await screen.findByText('Uploading...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText('Uploading...')).not.toBeInTheDocument();
      });
    });

    it('should disable input during upload', async () => {
      mockUpload.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: null, error: null }), 100))
      );

      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      expect(input).toBeDisabled();

      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle storage upload errors', async () => {
      const storageError = new Error('Storage error');
      mockUpload.mockResolvedValue({ data: null, error: storageError });

      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Storage error/)).toBeInTheDocument();
      });
    });

    it('should handle attachment update errors', async () => {
      const updateError = new Error('Update error');
      mockEq.mockResolvedValue({ data: null, error: updateError });

      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Update error/)).toBeInTheDocument();
      });
    });

    it('should handle attachment insert errors', async () => {
      const insertError = new Error('Insert error');
      mockInsert.mockResolvedValue({ data: null, error: insertError });

      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Insert error/)).toBeInTheDocument();
      });
    });

    it('should show generic error message for unknown errors', async () => {
      mockUpload.mockRejectedValue('Unknown error');

      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });
    });

    it('should not call onUploaded when upload fails', async () => {
      const uploadError = new Error('Upload failed');
      mockUpload.mockResolvedValue({ data: null, error: uploadError });
      const onUploaded = vi.fn();

      render(<PhotoUpload {...defaultProps} editMode={true} onUploaded={onUploaded} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText(/Upload failed/)).toBeInTheDocument();
      });

      expect(onUploaded).not.toHaveBeenCalled();
    });
  });

  describe('File Extensions', () => {
    it('should extract extension from filename', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'my-photo.jpeg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          expect.stringContaining('.jpeg'),
          file,
          expect.any(Object)
        );
      });
    });

    it('should handle filename with multiple dots', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'my.photo.jpeg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          expect.stringContaining('.jpeg'),
          file,
          expect.any(Object)
        );
      });
    });

    it('should convert extension to lowercase', async () => {
      render(<PhotoUpload {...defaultProps} editMode={true} />);

      const file = new File(['image'], 'photo.PNG', { type: 'image/png' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          expect.stringContaining('.png'),
          file,
          expect.any(Object)
        );
      });
    });
  });

  describe('Equipment ID', () => {
    it('should handle null equipmentId', async () => {
      render(<PhotoUpload {...defaultProps} equipmentId={null} editMode={true} />);

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = document.getElementById('upload-photo') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalledWith(
          `equipment/null/${mockUuid}.jpg`,
          file,
          expect.any(Object)
        );
      });
    });
  });
});
