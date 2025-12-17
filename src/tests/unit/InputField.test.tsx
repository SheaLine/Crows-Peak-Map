import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InputField from '@/components/Auth/InputField';

describe('InputField Component', () => {
  it('should render with label and input', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="test-input"
        label="Test Label"
        value=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should use id as type by default', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="email"
        label="Email"
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it('should use custom type when provided', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="custom-id"
        label="Password"
        type="password"
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Password') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('should display current value', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="name"
        label="Name"
        value="John Doe"
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Name') as HTMLInputElement;
    expect(input.value).toBe('John Doe');
  });

  it('should call onChange when user types', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="username"
        label="Username"
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Username');
    fireEvent.change(input, { target: { value: 'newuser' } });

    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it('should render with required attribute when required is true', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="required-field"
        label="Required Field"
        value=""
        onChange={mockOnChange}
        required={true}
      />
    );

    const input = screen.getByLabelText('Required Field') as HTMLInputElement;
    expect(input.required).toBe(true);
  });

  it('should not be required by default', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="optional-field"
        label="Optional Field"
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Optional Field') as HTMLInputElement;
    expect(input.required).toBe(false);
  });

  it('should set autocomplete attribute', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="email"
        label="Email"
        value=""
        onChange={mockOnChange}
        autoComplete="email"
      />
    );

    const input = screen.getByLabelText('Email') as HTMLInputElement;
    expect(input.autocomplete).toBe('email');
  });

  it('should display placeholder text', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="search"
        label="Search"
        value=""
        onChange={mockOnChange}
        placeholder="Enter search term..."
      />
    );

    const input = screen.getByPlaceholderText('Enter search term...');
    expect(input).toBeInTheDocument();
  });

  it('should render extra content when provided', () => {
    const mockOnChange = vi.fn();
    const extraContent = <span data-testid="extra-content">Forgot?</span>;

    render(
      <InputField
        id="password"
        label="Password"
        value=""
        onChange={mockOnChange}
        extra={extraContent}
      />
    );

    expect(screen.getByTestId('extra-content')).toBeInTheDocument();
    expect(screen.getByText('Forgot?')).toBeInTheDocument();
  });

  it('should not render extra content div when extra is not provided', () => {
    const mockOnChange = vi.fn();

    const { container } = render(
      <InputField
        id="simple"
        label="Simple Field"
        value=""
        onChange={mockOnChange}
      />
    );

    // Should only have one div in the label wrapper (the label itself)
    const labelWrapper = container.querySelector('.flex.items-center.justify-between');
    expect(labelWrapper?.children.length).toBe(1); // Only the label
  });

  it('should have correct id and name attributes', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="unique-id"
        label="Field"
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Field') as HTMLInputElement;
    expect(input.id).toBe('unique-id');
    expect(input.name).toBe('unique-id');
  });

  it('should apply correct CSS classes for styling', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="styled"
        label="Styled Field"
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Styled Field');
    expect(input.className).toContain('rounded-md');
    expect(input.className).toContain('w-full');
    expect(input.className).toContain('px-4');
  });

  it('should handle multiple onChange events', () => {
    const mockOnChange = vi.fn();

    render(
      <InputField
        id="multi-change"
        label="Multi Change"
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Multi Change');

    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ab' } });
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(mockOnChange).toHaveBeenCalledTimes(3);
  });

  it('should work with controlled component pattern', () => {
    const mockOnChange = vi.fn();

    const { rerender } = render(
      <InputField
        id="controlled"
        label="Controlled"
        value="initial"
        onChange={mockOnChange}
      />
    );

    let input = screen.getByLabelText('Controlled') as HTMLInputElement;
    expect(input.value).toBe('initial');

    // Simulate parent component updating value
    rerender(
      <InputField
        id="controlled"
        label="Controlled"
        value="updated"
        onChange={mockOnChange}
      />
    );

    input = screen.getByLabelText('Controlled') as HTMLInputElement;
    expect(input.value).toBe('updated');
  });
});
