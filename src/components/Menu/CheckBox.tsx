import type { ReactNode } from "react";

type FilterCheckboxProps = {
  icon: ReactNode;        // pass an icon component
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function FilterCheckbox({
  icon,
  label,
  checked,
  onChange,
}: FilterCheckboxProps) {
  return (
    <label
      className="flex items-center justify-between w-full p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition"
    >
      <div className="flex items-center gap-2">
        <span className="text-gray-700 dark:text-gray-200">{icon}</span>
        <span className="text-sm text-gray-900 dark:text-gray-100 font-medium">
          {label}
        </span>
      </div>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
      />
    </label>
  );
}
