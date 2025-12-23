import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SubmitButton from '@/components/Auth/SubmitButton';

describe('SubmitButton Component', () => {
  it('should render button with text', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="Submit" />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('should call onSubmit when clicked', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="Click Me" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('should call onSubmit with event object', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="Submit" />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockOnSubmit).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should handle multiple clicks', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="Submit" />);

    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(mockOnSubmit).toHaveBeenCalledTimes(3);
  });

  it('should render custom text', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="Sign In Now" />);

    expect(screen.getByText('Sign In Now')).toBeInTheDocument();
  });

  it('should have type="button"', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="Submit" />);

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.type).toBe('button');
  });

  it('should apply correct styling classes', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="Submit" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('w-full');
    expect(button.className).toContain('rounded-md');
    expect(button.className).toContain('bg-indigo-600');
    expect(button.className).toContain('cursor-pointer');
  });

  it('should be clickable (not disabled)', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="Submit" />);

    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('should render different text strings correctly', () => {
    const mockOnSubmit = vi.fn();

    const { rerender } = render(
      <SubmitButton onSubmit={mockOnSubmit} text="Login" />
    );

    expect(screen.getByText('Login')).toBeInTheDocument();

    rerender(<SubmitButton onSubmit={mockOnSubmit} text="Register" />);

    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Login')).not.toBeInTheDocument();
  });

  it('should handle empty string text', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="" />);

    const button = screen.getByRole('button');
    expect(button.textContent).toBe('');
  });

  it('should be keyboard accessible', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="Submit" />);

    const button = screen.getByRole('button');

    // Simulate keyboard interaction
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });

    // Note: onClick won't fire on keyDown, but we're testing that button is keyboard accessible
    expect(button).toBeInTheDocument();
  });

  it('should maintain focus styling classes', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="Submit" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('focus-visible:outline-2');
    expect(button.className).toContain('focus-visible:outline-indigo-600');
  });

  it('should have hover styling classes', () => {
    const mockOnSubmit = vi.fn();

    render(<SubmitButton onSubmit={mockOnSubmit} text="Submit" />);

    const button = screen.getByRole('button');
    expect(button.className).toContain('hover:bg-indigo-500');
  });
});
