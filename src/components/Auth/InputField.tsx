import React from "react";

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  extra?: React.ReactNode;
}

function InputField({
  id,
  label,
  type = id,
  value,
  onChange,
  required = false,
  autoComplete,
  placeholder,
  extra,
}: InputFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-lg font-medium text-gray-900 dark:text-gray-100"
        >
          {label}
        </label>
        {extra && <div className="text-lg">{extra}</div>}
      </div>
      <div className="mt-3">
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="block w-full rounded-md bg-white px-4 py-3 text-xl text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
        />
      </div>
    </div>
  );
}

export default InputField;
