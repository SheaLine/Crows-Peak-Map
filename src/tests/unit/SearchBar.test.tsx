import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar from '@/components/Menu/SearchBar';

describe('SearchBar Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render with default placeholder', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="" onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText('Search equipment...')).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    const mockOnChange = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        placeholder="Find items..."
      />
    );

    expect(screen.getByPlaceholderText('Find items...')).toBeInTheDocument();
  });

  it('should display current value', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="test query" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('test query');
  });

  it('should update local state when typing', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'new search' } });

    expect((input as HTMLInputElement).value).toBe('new search');
  });

  it('should debounce onChange calls', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="" onChange={mockOnChange} debounceMs={300} />);

    const input = screen.getByRole('textbox');

    // Type quickly
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });

    // Should not have called onChange yet
    expect(mockOnChange).not.toHaveBeenCalled();

    // Fast-forward time
    vi.advanceTimersByTime(300);

    // Now it should have been called once with the final value
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('abc');
  });

  it('should respect custom debounce time', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="" onChange={mockOnChange} debounceMs={500} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    // Should not call before debounce time
    vi.advanceTimersByTime(400);
    expect(mockOnChange).not.toHaveBeenCalled();

    // Should call after debounce time
    vi.advanceTimersByTime(100);
    expect(mockOnChange).toHaveBeenCalledWith('test');
  });

  it('should show clear button when input has value', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="test" onChange={mockOnChange} />);

    const clearButton = screen.getByLabelText('Clear');
    expect(clearButton).toBeInTheDocument();
  });

  it('should not show clear button when input is empty', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="" onChange={mockOnChange} />);

    const clearButton = screen.queryByLabelText('Clear');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('should clear input when clear button is clicked', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="test query" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('test query');

    const clearButton = screen.getByLabelText('Clear');
    fireEvent.click(clearButton);

    expect(input.value).toBe('');
  });

  it('should call onChange with empty string after debounce when cleared', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="test" onChange={mockOnChange} debounceMs={300} />);

    const clearButton = screen.getByLabelText('Clear');
    fireEvent.click(clearButton);

    vi.advanceTimersByTime(300);

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  it('should render search icon', () => {
    const mockOnChange = vi.fn();

    const { container } = render(<SearchBar value="" onChange={mockOnChange} />);

    // Search icon should be present (checking for the parent span)
    const iconContainer = container.querySelector('.absolute.inset-y-0.left-3');
    expect(iconContainer).toBeInTheDocument();
  });

  it('should render X icon when clear button is shown', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="test" onChange={mockOnChange} />);

    const clearButton = screen.getByLabelText('Clear');
    expect(clearButton).toBeInTheDocument();
    expect(clearButton.querySelector('svg')).toBeInTheDocument();
  });

  it('should sync local value when external value changes', () => {
    const mockOnChange = vi.fn();

    const { rerender } = render(
      <SearchBar value="initial" onChange={mockOnChange} />
    );

    let input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('initial');

    // Parent component updates value
    rerender(<SearchBar value="updated" onChange={mockOnChange} />);

    input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('updated');
  });

  it('should cancel previous debounce timer when typing continues', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="" onChange={mockOnChange} debounceMs={300} />);

    const input = screen.getByRole('textbox');

    // Type 'a'
    fireEvent.change(input, { target: { value: 'a' } });
    vi.advanceTimersByTime(200);

    // Type 'ab' before debounce completes
    fireEvent.change(input, { target: { value: 'ab' } });
    vi.advanceTimersByTime(200);

    // Type 'abc' before debounce completes
    fireEvent.change(input, { target: { value: 'abc' } });
    vi.advanceTimersByTime(300);

    // Should only call onChange once with final value
    expect(mockOnChange).toHaveBeenCalledTimes(1);
    expect(mockOnChange).toHaveBeenCalledWith('abc');
  });

  it('should have correct styling classes', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input.className).toContain('w-full');
    expect(input.className).toContain('rounded-lg');
    expect(input.className).toContain('border');
  });

  it('should show clear button immediately when typing', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="" onChange={mockOnChange} />);

    // Initially no clear button
    expect(screen.queryByLabelText('Clear')).not.toBeInTheDocument();

    // Type something
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });

    // Clear button should appear immediately (not debounced)
    expect(screen.getByLabelText('Clear')).toBeInTheDocument();
  });

  it('should handle empty string properly', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(screen.queryByLabelText('Clear')).not.toBeInTheDocument();
  });

  it('should handle whitespace-only input', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="" onChange={mockOnChange} debounceMs={300} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });

    vi.advanceTimersByTime(300);

    expect(mockOnChange).toHaveBeenCalledWith('   ');

    // Clear button should show for whitespace
    expect(screen.getByLabelText('Clear')).toBeInTheDocument();
  });

  it('should handle special characters', () => {
    const mockOnChange = vi.fn();

    render(<SearchBar value="" onChange={mockOnChange} debounceMs={300} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '!@#$%^&*()' } });

    vi.advanceTimersByTime(300);

    expect(mockOnChange).toHaveBeenCalledWith('!@#$%^&*()');
  });
});
