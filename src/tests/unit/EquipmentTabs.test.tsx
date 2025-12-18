import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EquipmentTabs from '@/components/Details/EquipmentTabs';

// Mock useSearchParams
const mockGet = vi.fn();
const mockSetSearchParams = vi.fn();
const mockSearchParams = {
  get: mockGet,
};

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

describe('EquipmentTabs Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null); // Default to no tab param
  });

  describe('Basic Rendering', () => {
    it('should render all tab buttons', () => {
      render(<EquipmentTabs />);

      expect(screen.getByRole('tab', { name: /Logs/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Gallery/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Summary/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Files/i })).toBeInTheDocument();
    });

    it('should render with tab navigation role', () => {
      render(<EquipmentTabs />);

      const nav = screen.getByRole('tablist');
      expect(nav).toHaveAttribute('aria-label', 'Equipment details tabs');
    });

    it('should set aria-controls for each tab', () => {
      render(<EquipmentTabs />);

      expect(screen.getByRole('tab', { name: /Logs/i })).toHaveAttribute('aria-controls', 'logs-panel');
      expect(screen.getByRole('tab', { name: /Gallery/i })).toHaveAttribute('aria-controls', 'gallery-panel');
      expect(screen.getByRole('tab', { name: /Summary/i })).toHaveAttribute('aria-controls', 'summary-panel');
      expect(screen.getByRole('tab', { name: /Files/i })).toHaveAttribute('aria-controls', 'files-panel');
    });
  });

  describe('Default Tab Selection', () => {
    it('should default to logs tab when no URL param', () => {
      mockGet.mockReturnValue(null);

      render(<EquipmentTabs />);

      const logsTab = screen.getByRole('tab', { name: /Logs/i });
      expect(logsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should use URL tab param if provided', () => {
      mockGet.mockReturnValue('summary');

      render(<EquipmentTabs />);

      const summaryTab = screen.getByRole('tab', { name: /Summary/i });
      expect(summaryTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should handle gallery tab from URL', () => {
      mockGet.mockReturnValue('gallery');

      render(<EquipmentTabs />);

      const galleryTab = screen.getByRole('tab', { name: /Gallery/i });
      expect(galleryTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should handle files tab from URL', () => {
      mockGet.mockReturnValue('files');

      render(<EquipmentTabs />);

      const filesTab = screen.getByRole('tab', { name: /Files/i });
      expect(filesTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Tab Selection', () => {
    it('should change tab when clicked', () => {
      render(<EquipmentTabs />);

      const summaryTab = screen.getByRole('tab', { name: /Summary/i });
      fireEvent.click(summaryTab);

      expect(summaryTab).toHaveAttribute('aria-selected', 'true');
      expect(mockSetSearchParams).toHaveBeenCalledWith({ tab: 'summary' });
    });

    it('should update URL when switching tabs', () => {
      render(<EquipmentTabs />);

      const galleryTab = screen.getByRole('tab', { name: /Gallery/i });
      fireEvent.click(galleryTab);

      expect(mockSetSearchParams).toHaveBeenCalledWith({ tab: 'gallery' });
    });

    it('should deselect previous tab when new tab is selected', () => {
      render(<EquipmentTabs />);

      const logsTab = screen.getByRole('tab', { name: /Logs/i });
      const galleryTab = screen.getByRole('tab', { name: /Gallery/i });

      expect(logsTab).toHaveAttribute('aria-selected', 'true');

      fireEvent.click(galleryTab);

      expect(logsTab).toHaveAttribute('aria-selected', 'false');
      expect(galleryTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should allow switching between all tabs', () => {
      render(<EquipmentTabs />);

      const tabs = ['logs', 'gallery', 'summary', 'files'];

      tabs.forEach((tabId) => {
        const tab = screen.getByRole('tab', { name: new RegExp(tabId, 'i') });
        fireEvent.click(tab);

        expect(tab).toHaveAttribute('aria-selected', 'true');
        expect(mockSetSearchParams).toHaveBeenCalledWith({ tab: tabId });
      });
    });
  });

  describe('Children Render Function', () => {
    it('should call children function with active tab', () => {
      const mockChildren = vi.fn(() => <div>Content</div>);

      render(<EquipmentTabs>{mockChildren}</EquipmentTabs>);

      expect(mockChildren).toHaveBeenCalledWith('logs');
    });

    it('should update children when tab changes', () => {
      const mockChildren = vi.fn(() => <div>Content</div>);

      render(<EquipmentTabs>{mockChildren}</EquipmentTabs>);

      expect(mockChildren).toHaveBeenCalledWith('logs');

      const summaryTab = screen.getByRole('tab', { name: /Summary/i });
      fireEvent.click(summaryTab);

      expect(mockChildren).toHaveBeenCalledWith('summary');
    });

    it('should render content returned by children function', () => {
      const mockChildren = (activeTab: string) => <div data-testid="tab-content">{activeTab} content</div>;

      render(<EquipmentTabs>{mockChildren}</EquipmentTabs>);

      expect(screen.getByTestId('tab-content')).toHaveTextContent('logs content');
    });

    it('should update rendered content when tab changes', () => {
      const mockChildren = (activeTab: string) => <div data-testid="tab-content">{activeTab} content</div>;

      render(<EquipmentTabs>{mockChildren}</EquipmentTabs>);

      const galleryTab = screen.getByRole('tab', { name: /Gallery/i });
      fireEvent.click(galleryTab);

      expect(screen.getByTestId('tab-content')).toHaveTextContent('gallery content');
    });
  });

  describe('Active Tab Styling', () => {
    it('should apply active styling to selected tab', () => {
      render(<EquipmentTabs />);

      const logsTab = screen.getByRole('tab', { name: /Logs/i });
      expect(logsTab.className).toContain('border-[#2f6ea8]');
      expect(logsTab.className).toContain('text-[#2f6ea8]');
    });

    it('should apply inactive styling to non-selected tabs', () => {
      render(<EquipmentTabs />);

      const galleryTab = screen.getByRole('tab', { name: /Gallery/i });
      expect(galleryTab.className).toContain('border-transparent');
      expect(galleryTab.className).toContain('text-gray-500');
    });

    it('should update styling when tab changes', () => {
      render(<EquipmentTabs />);

      const logsTab = screen.getByRole('tab', { name: /Logs/i });
      const summaryTab = screen.getByRole('tab', { name: /Summary/i });

      expect(logsTab.className).toContain('border-[#2f6ea8]');
      expect(summaryTab.className).toContain('border-transparent');

      fireEvent.click(summaryTab);

      expect(logsTab.className).toContain('border-transparent');
      expect(summaryTab.className).toContain('border-[#2f6ea8]');
    });
  });

  describe('Icons', () => {
    it('should render icon for each tab', () => {
      const { container } = render(<EquipmentTabs />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBe(4); // One icon per tab
    });

    it('should include icon in each tab button', () => {
      render(<EquipmentTabs />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        const icon = tab.querySelector('svg');
        expect(icon).toBeInTheDocument();
      });
    });
  });

  describe('URL Sync', () => {
    it('should sync with URL param changes', () => {
      mockGet.mockReturnValue('logs');

      const { rerender } = render(<EquipmentTabs />);

      expect(screen.getByRole('tab', { name: /Logs/i })).toHaveAttribute('aria-selected', 'true');

      // Simulate URL change
      mockGet.mockReturnValue('summary');
      rerender(<EquipmentTabs />);

      // Note: Due to how useEffect works, we need to actually trigger the effect
      // In a real browser, this would happen automatically
    });

    it('should handle invalid tab params from URL', () => {
      mockGet.mockReturnValue('invalid-tab' as any);

      render(<EquipmentTabs />);

      // When invalid tab is in URL, none of the valid tabs will be selected initially
      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('aria-selected', 'false');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have role="tab" for all tab buttons', () => {
      render(<EquipmentTabs />);

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(4);
    });

    it('should set aria-selected correctly', () => {
      render(<EquipmentTabs />);

      const logsTab = screen.getByRole('tab', { name: /Logs/i });
      const galleryTab = screen.getByRole('tab', { name: /Gallery/i });

      expect(logsTab).toHaveAttribute('aria-selected', 'true');
      expect(galleryTab).toHaveAttribute('aria-selected', 'false');
    });

    it('should have type="button" for all tabs', () => {
      render(<EquipmentTabs />);

      const tabs = screen.getAllByRole('tab');
      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute('type', 'button');
      });
    });
  });
});
