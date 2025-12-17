import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterCheckbox from '@/components/Menu/CheckBox';

describe('FilterCheckbox Component', () => {
  const mockIcon = <span data-testid="test-icon">📦</span>;

  it('should render with label and icon', () => {
    const mockOnChange = vi.fn();

    render(
      <FilterCheckbox
        icon={mockIcon}
        label="Test Label"
        checked={false}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('should render checkbox input', () => {
    const mockOnChange = vi.fn();

    render(
      <FilterCheckbox
        icon={mockIcon}
        label="Equipment"
        checked={false}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
  });

  it('should show checked state when checked is true', () => {
    const mockOnChange = vi.fn();

    render(
      <FilterCheckbox
        icon={mockIcon}
        label="Equipment"
        checked={true}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('should show unchecked state when checked is false', () => {
    const mockOnChange = vi.fn();

    render(
      <FilterCheckbox
        icon={mockIcon}
        label="Equipment"
        checked={false}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it('should call onChange with true when unchecked checkbox is clicked', () => {
    const mockOnChange = vi.fn();

    render(
      <FilterCheckbox
        icon={mockIcon}
        label="Equipment"
        checked={false}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('should call onChange with false when checked checkbox is clicked', () => {
    const mockOnChange = vi.fn();

    render(
      <FilterCheckbox
        icon={mockIcon}
        label="Equipment"
        checked={true}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith(false);
  });

  it('should toggle when label is clicked', () => {
    const mockOnChange = vi.fn();

    render(
      <FilterCheckbox
        icon={mockIcon}
        label="Equipment"
        checked={false}
        onChange={mockOnChange}
      />
    );

    const label = screen.getByText('Equipment');
    fireEvent.click(label);

    expect(mockOnChange).toHaveBeenCalledWith(true);
  });

  it('should render different icons', () => {
    const mockOnChange = vi.fn();
    const customIcon = <span data-testid="custom-icon">🔧</span>;

    render(
      <FilterCheckbox
        icon={customIcon}
        label="Tools"
        checked={false}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.getByText('🔧')).toBeInTheDocument();
  });

  it('should update when checked prop changes', () => {
    const mockOnChange = vi.fn();

    const { rerender } = render(
      <FilterCheckbox
        icon={mockIcon}
        label="Equipment"
        checked={false}
        onChange={mockOnChange}
      />
    );

    let checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    rerender(
      <FilterCheckbox
        icon={mockIcon}
        label="Equipment"
        checked={true}
        onChange={mockOnChange}
      />
    );

    checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('should apply correct styling classes', () => {
    const mockOnChange = vi.fn();

    const { container } = render(
      <FilterCheckbox
        icon={mockIcon}
        label="Equipment"
        checked={false}
        onChange={mockOnChange}
      />
    );

    const label = container.querySelector('label');
    expect(label?.className).toContain('flex');
    expect(label?.className).toContain('items-center');
    expect(label?.className).toContain('cursor-pointer');
    expect(label?.className).toContain('rounded-lg');
  });

  it('should have hover styles', () => {
    const mockOnChange = vi.fn();

    const { container } = render(
      <FilterCheckbox
        icon={mockIcon}
        label="Equipment"
        checked={false}
        onChange={mockOnChange}
      />
    );

    const label = container.querySelector('label');
    expect(label?.className).toContain('hover:bg-gray-50');
  });

  it('should render multiple checkboxes independently', () => {
    const mockOnChange1 = vi.fn();
    const mockOnChange2 = vi.fn();

    const { container } = render(
      <div>
        <FilterCheckbox
          icon={mockIcon}
          label="Filter 1"
          checked={false}
          onChange={mockOnChange1}
        />
        <FilterCheckbox
          icon={mockIcon}
          label="Filter 2"
          checked={true}
          onChange={mockOnChange2}
        />
      </div>
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);

    expect((checkboxes[0] as HTMLInputElement).checked).toBe(false);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(true);
  });

  it('should handle rapid clicks', () => {
    const mockOnChange = vi.fn();

    render(
      <FilterCheckbox
        icon={mockIcon}
        label="Equipment"
        checked={false}
        onChange={mockOnChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);

    expect(mockOnChange).toHaveBeenCalledTimes(3);
  });

  it('should render complex icon components', () => {
    const mockOnChange = vi.fn();
    const ComplexIcon = () => (
      <svg data-testid="complex-icon">
        <circle cx="10" cy="10" r="5" />
      </svg>
    );

    render(
      <FilterCheckbox
        icon={<ComplexIcon />}
        label="Complex"
        checked={false}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByTestId('complex-icon')).toBeInTheDocument();
  });
});
