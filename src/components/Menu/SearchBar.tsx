import { useMemo, useState, useEffect } from "react";
import { IconMap } from "../../data/icons";

interface SearchBarProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search equipment...",
  debounceMs = 300,
}: SearchBarProps) {
  const [local, setLocal] = useState(value);
  useEffect(() => setLocal(value), [value]);

  // simple debounce so we don't re-filter on every keystroke
  useEffect(() => {
    const id = setTimeout(() => onChange(local), debounceMs);
    return () => clearTimeout(id);
  }, [local, onChange, debounceMs]);

  const showClear = useMemo(() => local.length > 0, [local]);

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-3 flex items-center">
        <IconMap.Search className="h-4 w-4 text-gray-800 dark:text-white" />
      </span>
      <input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 pl-8 pr-8 p-2 text-sm
                   text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {showClear && (
        <button
          type="button"
          onClick={() => setLocal("")}
          className="absolute inset-y-0 right-2 flex items-center text-white hover:text-gray-600"
          aria-label="Clear"
        >
          <IconMap.X className="h-4 w-4 text-gray-800 dark:text-white" />
        </button>
      )}
    </div>
  );
}
