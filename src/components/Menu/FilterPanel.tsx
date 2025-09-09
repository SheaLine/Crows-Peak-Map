import { useState } from "react";
import type { TypeRow } from "../../App";
import FilterCheckbox from "./CheckBox";
import { IconMap } from "../../data/icons";
import SearchBar from "./SearchBar";

type FilterPanelProps = {
  filters: number[];
  setFilters: (filters: number[]) => void;
  types: TypeRow[];
  showBoundary: boolean;
  setShowBoundary: (show: boolean) => void;
  search: string;
  setSearch: (s: string) => void;
};

export default function FilterPanel({
  filters,
  setFilters,
  types,
  showBoundary,
  setShowBoundary,
  search,
  setSearch,
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFilter = (id: number) => {
    if (filters.includes(id)) {
      setFilters(filters.filter((f) => f !== id));
    } else {
      setFilters([...filters, id]);
    }
  };

  return (
    <>
      {/*
        Hamburger button — only visible on mobile
      */}
      <button
        className="md:hidden absolute top-59 left-2 p-2 bg-white dark:bg-gray-800 rounded-md shadow-md z-[5000]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Hamburger icon */}
        <div className="space-y-1">
          <span className="block h-0.5 w-6 bg-gray-800 dark:bg-gray-200"></span>
          <span className="block h-0.5 w-6 bg-gray-800 dark:bg-gray-200"></span>
          <span className="block h-0.5 w-6 bg-gray-800 dark:bg-gray-200"></span>
        </div>
      </button>

      {/* Filter panel */}
      <div
        className={`
          fixed top-0 left-0 h-full w-72 bg-white dark:bg-gray-900 shadow-lg p-4 space-y-4 transform transition-transform duration-300 z-[5000]
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:static md:translate-x-0
        `}
      >
        <div className="flex items-center justify-between md:justify-start">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100"></h2>
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setIsOpen(false)}
          >
            <IconMap.X className="h-6 w-6 text-white" />
          </button>
        </div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Search by Name
        </h2>
        <div className="space-y-2">
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
          Filter by Type
        </h2>
        {types.map((t) => {
          const Icon = t.icon ? IconMap[t.icon] : undefined;
          return (
            <FilterCheckbox
              key={t.id}
              icon={
                Icon ? (
                  <Icon
                    className="h-5 w-5"
                    style={{ color: t.color ?? "#ffffff" }}
                  />
                ) : (
                  <span />
                )
              }
              label={t.display_name}
              checked={filters.includes(t.id)}
              onChange={() => toggleFilter(t.id)}
            />
          );
        })}

        <div className="mt-auto px-4 pt-4 pb-4 border-t border-gray-300 dark:border-gray-700">
          <FilterCheckbox
            icon={<IconMap.Border className="h-5 w-5" />}
            label="Property Line"
            checked={showBoundary}
            onChange={setShowBoundary}
          />
        </div>
      </div>
    </>
  );
}
