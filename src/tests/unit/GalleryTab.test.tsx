import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GalleryTab from '@/components/Details/GalleryTab';

// Mock UUID
const mockUuid = 'test-uuid-1234';
vi.mock('uuid', () => ({
  v4: () => mockUuid,
}));

// Mock supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();
const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockDelete = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockCreateSignedUrls = vi.fn();

vi.mock('@/supabaseClient', () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    storage: {
      from: () => ({
        upload: mockUpload,
        remove: mockRemove,
        createSignedUrls: mockCreateSignedUrls,
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

// Mock window.confirm and window.alert
global.confirm = vi.fn(() => true);
global.alert = vi.fn();

describe('GalleryTab Component', () => {
  const defaultProps = {
    equipmentId: 'equipment-123',
    isAdmin: true,
    editMode: false,
  };

  const mockImages = [
    {
      id: '1',
      equipment_id: 'equipment-123',
      url: 'equipment/equipment-123/image1.jpg',
      file_type: 'image/jpeg',
      label: 'Photo 1',
      is_primary: true,
      is_image: true,
      uploaded_at: '2024-01-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      equipment_id: 'equipment-123',
      url: 'equipment/equipment-123/image2.jpg',
      file_type: 'image/jpeg',
      label: 'Photo 2',
      is_primary: false,
      is_image: true,
      uploaded_at: '2024-01-02T00:00:00Z',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCachedUrls.mockReturnValue(null);

    // Setup default mock chains for: .select().eq().eq().order()
    mockOrder.mockReturnValue(Promise.resolve({ data: [], error: null }));
    const mockEq2 = vi.fn().mockReturnValue({ order: mockOrder });
    mockEq.mockReturnValue({ eq: mockEq2 });
    mockSelect.mockReturnValue({ eq: mockEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === 'attachments') {
        return {
          select: mockSelect,
          delete: mockDelete,
          update: mockUpdate,
          insert: mockInsert,
        };
      }
      return {};
    });

    mockCreateSignedUrls.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching images', () => {
      mockOrder.mockReturnValue(new Promise(() => {})); // Never resolves

      const { container } = render(<GalleryTab {...defaultProps} />);

      expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show "No images yet" when there are no images', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('No images yet')).toBeInTheDocument();
      });
    });

    it('should show upload hint for admins in edit mode', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Click "Upload Images" to add photos')).toBeInTheDocument();
      });
    });

    it('should not show upload hint for non-admins', async () => {
      mockOrder.mockResolvedValue({ data: [], error: null });

      render(<GalleryTab {...defaultProps} isAdmin={false} editMode={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Click "Upload Images" to add photos')).not.toBeInTheDocument();
      });
    });
  });

  describe('Image Display', () => {
    beforeEach(() => {
      mockOrder.mockResolvedValue({ data: mockImages, error: null });
      mockCreateSignedUrls.mockResolvedValue({
        data: [
          { path: 'equipment/equipment-123/image1.jpg', signedUrl: 'https://signed-url-1.com' },
          { path: 'equipment/equipment-123/image2.jpg', signedUrl: 'https://signed-url-2.com' },
        ],
        error: null,
      });
    });

    it('should display images in a grid', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByAltText('Photo 1')).toBeInTheDocument();
        expect(screen.getByAltText('Photo 2')).toBeInTheDocument();
      });
    });

    it('should show primary badge on primary image', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Primary')).toBeInTheDocument();
      });
    });

    it('should fetch and display images on mount', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByAltText('Photo 1')).toBeInTheDocument();
        expect(screen.getByAltText('Photo 2')).toBeInTheDocument();
      });
    });

    it('should sort images with primary first', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images[0]).toHaveAttribute('alt', 'Photo 1'); // Primary image first
      });
    });
  });

  describe('Image Caching', () => {
    beforeEach(() => {
      mockOrder.mockResolvedValue({ data: mockImages, error: null });
    });

    it('should use cached URLs when available', async () => {
      const cachedUrls = new Map([
        ['equipment/equipment-123/image1.jpg', 'https://cached-url-1.com'],
        ['equipment/equipment-123/image2.jpg', 'https://cached-url-2.com'],
      ]);
      mockGetCachedUrls.mockReturnValue(cachedUrls);

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(mockCreateSignedUrls).not.toHaveBeenCalled();
      });
    });

    it('should fetch and cache URLs when not cached', async () => {
      mockGetCachedUrls.mockReturnValue(null);
      mockCreateSignedUrls.mockResolvedValue({
        data: [
          { path: 'equipment/equipment-123/image1.jpg', signedUrl: 'https://signed-url-1.com' },
        ],
        error: null,
      });

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(mockCreateSignedUrls).toHaveBeenCalled();
        expect(mockSetCachedUrls).toHaveBeenCalled();
      });
    });
  });

  describe('Upload Button', () => {
    beforeEach(() => {
      mockOrder.mockResolvedValue({ data: [], error: null });
    });

    it('should show upload button for admins in edit mode', async () => {
      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Images')).toBeInTheDocument();
      });
    });

    it('should not show upload button in view mode', async () => {
      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Upload Images')).not.toBeInTheDocument();
      });
    });

    it('should not show upload button for non-admins', async () => {
      render(<GalleryTab {...defaultProps} isAdmin={false} editMode={true} />);

      await waitFor(() => {
        expect(screen.queryByText('Upload Images')).not.toBeInTheDocument();
      });
    });
  });

  describe('Image Upload', () => {
    beforeEach(() => {
      mockOrder.mockResolvedValue({ data: [], error: null });
      mockUpload.mockResolvedValue({ data: null, error: null });
      mockInsert.mockResolvedValue({ data: null, error: null });
    });

    it('should upload selected images', async () => {
      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Images')).toBeInTheDocument();
      });

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByText('Upload Images').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockUpload).toHaveBeenCalled();
      });
    });

    it('should skip non-image files', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Images')).toBeInTheDocument();
      });

      const file = new File(['document'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByText('Upload Images').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(consoleWarnSpy).toHaveBeenCalled();
      });

      consoleWarnSpy.mockRestore();
    });

    it('should show uploading state during upload', async () => {
      mockUpload.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 100)));

      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Images')).toBeInTheDocument();
      });

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByText('Upload Images').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      expect(await screen.findByText('Uploading...')).toBeInTheDocument();
    });

    it('should clear cache after upload', async () => {
      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Images')).toBeInTheDocument();
      });

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByText('Upload Images').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockClearCache).toHaveBeenCalled();
      });
    });
  });

  describe('Delete Image', () => {
    beforeEach(() => {
      mockOrder.mockResolvedValue({ data: mockImages, error: null });
      mockCreateSignedUrls.mockResolvedValue({
        data: [
          { path: 'equipment/equipment-123/image1.jpg', signedUrl: 'https://signed-url-1.com' },
          { path: 'equipment/equipment-123/image2.jpg', signedUrl: 'https://signed-url-2.com' },
        ],
        error: null,
      });
      mockDelete.mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
      mockRemove.mockResolvedValue({ data: null, error: null });
    });

    it('should show delete button for admins in edit mode', async () => {
      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete image');
        expect(deleteButtons.length).toBe(2);
      });
    });

    it('should not show delete button in view mode', async () => {
      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={false} />);

      await waitFor(() => {
        expect(screen.queryByLabelText('Delete image')).not.toBeInTheDocument();
      });
    });

    it('should confirm before deleting', async () => {
      global.confirm = vi.fn(() => false);

      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete image');
        fireEvent.click(deleteButtons[0]);
      });

      expect(global.confirm).toHaveBeenCalled();
      expect(mockRemove).not.toHaveBeenCalled();
    });

    it('should delete image when confirmed', async () => {
      global.confirm = vi.fn(() => true);

      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete image');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(mockRemove).toHaveBeenCalledWith(['equipment/equipment-123/image1.jpg']);
      });
    });

    it('should call onImageDeleted callback after deletion', async () => {
      global.confirm = vi.fn(() => true);
      const onImageDeleted = vi.fn();

      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} onImageDeleted={onImageDeleted} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete image');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(onImageDeleted).toHaveBeenCalled();
      });
    });
  });

  describe('Make Primary', () => {
    beforeEach(() => {
      mockOrder.mockResolvedValue({ data: mockImages, error: null });
      mockCreateSignedUrls.mockResolvedValue({
        data: [
          { path: 'equipment/equipment-123/image1.jpg', signedUrl: 'https://signed-url-1.com' },
          { path: 'equipment/equipment-123/image2.jpg', signedUrl: 'https://signed-url-2.com' },
        ],
        error: null,
      });
      mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
    });

    it('should show "Make Primary" button for non-primary images in edit mode', async () => {
      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Make Primary')).toBeInTheDocument();
      });
    });

    it('should not show "Make Primary" button for primary image', async () => {
      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        const makePrimaryButtons = screen.queryAllByText('Make Primary');
        expect(makePrimaryButtons.length).toBe(1); // Only one button (for non-primary image)
      });
    });

    it('should set image as primary when clicked', async () => {
      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        const makePrimaryButton = screen.getByText('Make Primary');
        fireEvent.click(makePrimaryButton);
      });

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({ is_primary: false });
        expect(mockUpdate).toHaveBeenCalledWith({ is_primary: true });
      });
    });

    it('should call onImageDeleted after making primary', async () => {
      const onImageDeleted = vi.fn();

      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} onImageDeleted={onImageDeleted} />);

      await waitFor(() => {
        const makePrimaryButton = screen.getByText('Make Primary');
        fireEvent.click(makePrimaryButton);
      });

      await waitFor(() => {
        expect(onImageDeleted).toHaveBeenCalled();
      });
    });
  });

  describe('Lightbox', () => {
    beforeEach(() => {
      mockOrder.mockResolvedValue({ data: mockImages, error: null });
      mockCreateSignedUrls.mockResolvedValue({
        data: [
          { path: 'equipment/equipment-123/image1.jpg', signedUrl: 'https://signed-url-1.com' },
          { path: 'equipment/equipment-123/image2.jpg', signedUrl: 'https://signed-url-2.com' },
        ],
        error: null,
      });
    });

    it('should open lightbox when image is clicked', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        fireEvent.click(images[0].closest('button')!);
      });

      expect(screen.getByLabelText('Close')).toBeInTheDocument();
    });

    it('should show image counter in lightbox', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        fireEvent.click(images[0].closest('button')!);
      });

      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('should close lightbox when close button is clicked', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        fireEvent.click(images[0].closest('button')!);
      });

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
      });
    });

    it('should navigate to next image', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        fireEvent.click(images[0].closest('button')!);
      });

      expect(screen.getByText('1 / 2')).toBeInTheDocument();

      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);

      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    it('should navigate to previous image', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        fireEvent.click(images[1].closest('button')!);
      });

      expect(screen.getByText('2 / 2')).toBeInTheDocument();

      const prevButton = screen.getByLabelText('Previous image');
      fireEvent.click(prevButton);

      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('should wrap around when navigating forward past last image', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        fireEvent.click(images[1].closest('button')!);
      });

      expect(screen.getByText('2 / 2')).toBeInTheDocument();

      const nextButton = screen.getByLabelText('Next image');
      fireEvent.click(nextButton);

      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('should wrap around when navigating backward past first image', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        fireEvent.click(images[0].closest('button')!);
      });

      expect(screen.getByText('1 / 2')).toBeInTheDocument();

      const prevButton = screen.getByLabelText('Previous image');
      fireEvent.click(prevButton);

      expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    it('should close lightbox on Escape key', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        fireEvent.click(images[0].closest('button')!);
      });

      fireEvent.keyDown(window, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByLabelText('Close')).not.toBeInTheDocument();
      });
    });

    it('should navigate with arrow keys', async () => {
      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        fireEvent.click(images[0].closest('button')!);
      });

      expect(screen.getByText('1 / 2')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'ArrowRight' });

      expect(screen.getByText('2 / 2')).toBeInTheDocument();

      fireEvent.keyDown(window, { key: 'ArrowLeft' });

      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle fetch errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOrder.mockResolvedValue({ data: null, error: { message: 'Fetch error' } });

      render(<GalleryTab {...defaultProps} />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith('Failed to load images. Please try again.');
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle upload errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOrder.mockResolvedValue({ data: [], error: null });
      mockUpload.mockResolvedValue({ data: null, error: new Error('Upload error') });

      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        expect(screen.getByText('Upload Images')).toBeInTheDocument();
      });

      const file = new File(['image'], 'test.jpg', { type: 'image/jpeg' });
      const input = screen.getByText('Upload Images').closest('label')?.querySelector('input[type="file"]') as HTMLInputElement;

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith('Failed to upload some images. Please try again.');
      });

      consoleErrorSpy.mockRestore();
    });

    it('should handle delete errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      global.confirm = vi.fn(() => true);
      mockOrder.mockResolvedValue({ data: mockImages, error: null });
      mockCreateSignedUrls.mockResolvedValue({
        data: [
          { path: 'equipment/equipment-123/image1.jpg', signedUrl: 'https://signed-url-1.com' },
        ],
        error: null,
      });
      mockRemove.mockResolvedValue({ data: null, error: new Error('Delete error') });

      render(<GalleryTab {...defaultProps} isAdmin={true} editMode={true} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('Delete image');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith('Failed to delete image. Please try again.');
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
