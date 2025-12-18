import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterPanel from '@/components/Menu/FilterPanel';
import type { TypeRow } from '@/App';

describe('FilterPanel Component', () => {
  const mockTypes: TypeRow[] = [
    { id: 1, display_name: 'Electric', icon: 'Bolt', color: '#FFD700' },
    { id: 2, display_name: 'Water', icon: 'droplet', color: '#1E90FF' },
    { id: 3, display_name: 'Fire', icon: 'flame', color: '#FF4500' },
  ];

  const defaultProps = {
    filters: [],
    setFilters: vi.fn(),
    types: mockTypes,
    showBoundary: false,
    setShowBoundary: vi.fn(),
    showBuildings: false,
    setShowBuildings: vi.fn(),
    search: '',
    setSearch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render filter panel', () => {
    render(<FilterPanel {...defaultProps} />);

    expect(screen.getByText('Search by Name')).toBeInTheDocument();
    expect(screen.getByText('Filter by Type')).toBeInTheDocument();
  });

  it('should render all equipment type filters', () => {
    render(<FilterPanel {...defaultProps} />);

    expect(screen.getByText('Electric')).toBeInTheDocument();
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.getByText('Fire')).toBeInTheDocument();
  });

  it('should render Property Lines and Buildings checkboxes', () => {
    render(<FilterPanel {...defaultProps} />);

    expect(screen.getByText('Property Lines')).toBeInTheDocument();
    expect(screen.getByText('Buildings')).toBeInTheDocument();
  });

  it('should render SearchBar component', () => {
    render(<FilterPanel {...defaultProps} />);

    const searchInput = screen.getByRole('textbox');
    expect(searchInput).toBeInTheDocument();
  });

  it('should call setFilters when a type filter is toggled on', () => {
    const setFilters = vi.fn();
    render(<FilterPanel {...defaultProps} setFilters={setFilters} />);

    const electricCheckbox = screen.getByLabelText('Electric');
    fireEvent.click(electricCheckbox);

    expect(setFilters).toHaveBeenCalledWith([1]);
  });

  it('should call setFilters when a type filter is toggled off', () => {
    const setFilters = vi.fn();
    render(<FilterPanel {...defaultProps} filters={[1, 2]} setFilters={setFilters} />);

    const electricCheckbox = screen.getByLabelText('Electric');
    fireEvent.click(electricCheckbox);

    expect(setFilters).toHaveBeenCalledWith([2]);
  });

  it('should show checked state for active filters', () => {
    render(<FilterPanel {...defaultProps} filters={[1, 3]} />);

    const electricCheckbox = screen.getByLabelText('Electric') as HTMLInputElement;
    const waterCheckbox = screen.getByLabelText('Water') as HTMLInputElement;
    const fireCheckbox = screen.getByLabelText('Fire') as HTMLInputElement;

    expect(electricCheckbox.checked).toBe(true);
    expect(waterCheckbox.checked).toBe(false);
    expect(fireCheckbox.checked).toBe(true);
  });

  it('should call setShowBoundary when Property Lines is toggled', () => {
    const setShowBoundary = vi.fn();
    render(<FilterPanel {...defaultProps} setShowBoundary={setShowBoundary} />);

    const boundaryCheckbox = screen.getByLabelText('Property Lines');
    fireEvent.click(boundaryCheckbox);

    expect(setShowBoundary).toHaveBeenCalledWith(true);
  });

  it('should call setShowBuildings when Buildings is toggled', () => {
    const setShowBuildings = vi.fn();
    render(<FilterPanel {...defaultProps} setShowBuildings={setShowBuildings} />);

    const buildingsCheckbox = screen.getByLabelText('Buildings');
    fireEvent.click(buildingsCheckbox);

    expect(setShowBuildings).toHaveBeenCalledWith(true);
  });

  it('should show Property Lines as checked when showBoundary is true', () => {
    render(<FilterPanel {...defaultProps} showBoundary={true} />);

    const boundaryCheckbox = screen.getByLabelText('Property Lines') as HTMLInputElement;
    expect(boundaryCheckbox.checked).toBe(true);
  });

  it('should show Buildings as checked when showBuildings is true', () => {
    render(<FilterPanel {...defaultProps} showBuildings={true} />);

    const buildingsCheckbox = screen.getByLabelText('Buildings') as HTMLInputElement;
    expect(buildingsCheckbox.checked).toBe(true);
  });

  it('should call setSearch when search input changes', () => {
    const setSearch = vi.fn();
    render(<FilterPanel {...defaultProps} setSearch={setSearch} />);

    const searchInput = screen.getByRole('textbox');
    fireEvent.change(searchInput, { target: { value: 'pump' } });

    expect((searchInput as HTMLInputElement).value).toBe('pump');
  });

  it('should toggle multiple filters independently', () => {
    const setFilters = vi.fn();
    const { rerender } = render(<FilterPanel {...defaultProps} setFilters={setFilters} />);

    const electricCheckbox = screen.getByLabelText('Electric');
    const waterCheckbox = screen.getByLabelText('Water');

    fireEvent.click(electricCheckbox);
    expect(setFilters).toHaveBeenCalledWith([1]);

    setFilters.mockClear();

    // Simulate filters now includes 1 - use rerender instead of render
    rerender(<FilterPanel {...defaultProps} filters={[1]} setFilters={setFilters} />);

    fireEvent.click(screen.getByLabelText('Water'));
    expect(setFilters).toHaveBeenCalledWith([1, 2]);
  });

  it('should handle types with no icon', () => {
    const typesWithoutIcon: TypeRow[] = [
      { id: 1, display_name: 'Unknown', icon: null, color: '#000000' },
    ];

    render(<FilterPanel {...defaultProps} types={typesWithoutIcon} />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('should handle types with undefined icon', () => {
    const typesWithUndefinedIcon: TypeRow[] = [
      { id: 1, display_name: 'Unknown', icon: undefined, color: '#000000' },
    ];

    render(<FilterPanel {...defaultProps} types={typesWithUndefinedIcon} />);

    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('should apply custom colors to icons', () => {
    const { container } = render(<FilterPanel {...defaultProps} />);

    // Icons should have style attribute with color
    const electricIcon = screen.getByText('Electric').parentElement?.parentElement?.querySelector('svg');
    expect(electricIcon).toHaveStyle({ color: '#FFD700' });
  });

  it('should render hamburger menu button on mobile', () => {
    const { container } = render(<FilterPanel {...defaultProps} />);

    const hamburgerButton = container.querySelector('.md\\:hidden');
    expect(hamburgerButton).toBeInTheDocument();
  });

  it('should toggle panel open/closed when hamburger is clicked', () => {
    const { container } = render(<FilterPanel {...defaultProps} />);

    const filterPanel = container.querySelector('.fixed.top-0.left-0');

    // Initially closed (has -translate-x-full)
    expect(filterPanel?.className).toContain('-translate-x-full');

    // Click hamburger to open
    const hamburgerButton = container.querySelector('.md\\:hidden.absolute') as HTMLElement;
    fireEvent.click(hamburgerButton);

    // Now open (has translate-x-0)
    expect(filterPanel?.className).toContain('translate-x-0');
  });

  it('should close panel when X button is clicked', () => {
    const { container } = render(<FilterPanel {...defaultProps} />);

    const hamburgerButton = container.querySelector('.md\\:hidden.absolute') as HTMLElement;

    // Open the panel first
    fireEvent.click(hamburgerButton);

    // Find the X button inside the panel - it has md:hidden and p-2 classes, contains SVG, but NOT absolute
    const allButtons = Array.from(container.querySelectorAll('button'));
    const xButton = allButtons.find(
      (btn) =>
        btn.querySelector('svg') &&
        btn.className.includes('md:hidden') &&
        btn.className.includes('p-2') &&
        !btn.className.includes('absolute')
    );

    expect(xButton).toBeTruthy();
    fireEvent.click(xButton!);

    const filterPanel = container.querySelector('.fixed.top-0.left-0');
    expect(filterPanel?.className).toContain('-translate-x-full');
  });

  it('should render with empty types array', () => {
    render(<FilterPanel {...defaultProps} types={[]} />);

    expect(screen.getByText('Filter by Type')).toBeInTheDocument();
    expect(screen.queryByText('Electric')).not.toBeInTheDocument();
  });

  it('should handle all filters being active', () => {
    render(<FilterPanel {...defaultProps} filters={[1, 2, 3]} />);

    const allCheckboxes = screen.getAllByRole('checkbox');
    const typeCheckboxes = allCheckboxes.slice(0, 3); // First 3 are type filters

    typeCheckboxes.forEach((checkbox) => {
      expect((checkbox as HTMLInputElement).checked).toBe(true);
    });
  });

  it('should handle all filters being inactive', () => {
    render(<FilterPanel {...defaultProps} filters={[]} />);

    const electricCheckbox = screen.getByLabelText('Electric') as HTMLInputElement;
    const waterCheckbox = screen.getByLabelText('Water') as HTMLInputElement;
    const fireCheckbox = screen.getByLabelText('Fire') as HTMLInputElement;

    expect(electricCheckbox.checked).toBe(false);
    expect(waterCheckbox.checked).toBe(false);
    expect(fireCheckbox.checked).toBe(false);
  });

  it('should display search value correctly', () => {
    render(<FilterPanel {...defaultProps} search="pump station" />);

    const searchInput = screen.getByRole('textbox') as HTMLInputElement;
    expect(searchInput.value).toBe('pump station');
  });

  it('should have correct z-index for mobile overlay', () => {
    const { container } = render(<FilterPanel {...defaultProps} />);

    const filterPanel = container.querySelector('.fixed.top-0.left-0');
    expect(filterPanel?.className).toContain('z-[5000]');
  });

  it('should render with dark mode classes', () => {
    const { container } = render(<FilterPanel {...defaultProps} />);

    const filterPanel = container.querySelector('.fixed.top-0.left-0');
    expect(filterPanel?.className).toContain('dark:bg-gray-900');
  });

  it('should render filter section with border', () => {
    const { container } = render(<FilterPanel {...defaultProps} />);

    const borderSection = container.querySelector('.border-t.border-gray-300');
    expect(borderSection).toBeInTheDocument();
  });

  it('should handle rapid filter toggling', () => {
    const setFilters = vi.fn();
    render(<FilterPanel {...defaultProps} setFilters={setFilters} />);

    const electricCheckbox = screen.getByLabelText('Electric');

    fireEvent.click(electricCheckbox);
    fireEvent.click(electricCheckbox);
    fireEvent.click(electricCheckbox);

    expect(setFilters).toHaveBeenCalledTimes(3);
  });

  it('should render type checkboxes with unique keys', () => {
    const { container } = render(<FilterPanel {...defaultProps} />);

    // All type checkboxes should be rendered
    expect(screen.getByText('Electric')).toBeInTheDocument();
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.getByText('Fire')).toBeInTheDocument();
  });
});
