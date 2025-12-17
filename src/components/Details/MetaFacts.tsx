import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconMap } from "../../data/icons";
import clsx from "clsx";

// util
const isEmpty = (v: unknown) =>
  v == null ||
  (typeof v === "string" && v.trim() === "") ||
  (Array.isArray(v) && v.length === 0);
const humanize = (k: string) =>
  k
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (s) => s.toUpperCase());

function renderValue(v: unknown) {
  if (isEmpty(v)) return <span className="text-gray-400 italic">Unknown</span>;
  if (Array.isArray(v)) {
    return (
      <div className="flex flex-wrap justify-end gap-1">
        {v.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs"
          >
            {String(item)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof v === "object") {
    return <code className="text-xs">{JSON.stringify(v, null, 0)}</code>;
  }
  return <>{String(v)}</>;
}

type MetaFactsProps = {
  /** The metadata object you already have */
  metadata: Record<string, unknown> | null | undefined;
  isMobile: boolean;
  /** Optional: enable edit mode for inline editing */
  editMode?: boolean;
  /** Optional: hide some keys */
  hiddenKeys?: string[];
  /** Optional: rename some keys */
  labelMap?: Record<string, string>;
  /**
   * A stable key to persist order (e.g., `equipment:${equipmentId}:metaOrder`)
   * If omitted, no persistence happens.
   */
  storageKey?: string;
  /**
   * Called whenever order changes (use to save to DB if you like)
   * Receives the ordered array of keys.
   */
  onOrderChange?: (orderedKeys: string[]) => void;
  /** Keys to pin at top (drag still allowed, but they start at top) */
  preferredOrder?: string[];
  /** Saved order from database (highest priority) */
  savedOrder?: string[] | null;
  mobileInitialCount?: number;
  /** Called when field value changes (edit mode) */
  onFieldChange?: (key: string, newValue: string | string[]) => void;
  /** Called when field is deleted (edit mode) */
  onFieldDelete?: (key: string) => void;
  /** Called when new field is added (edit mode) */
  onFieldAdd?: (key: string, value: string | string[]) => void;
};

export default function MetaFacts({
  metadata,
  isMobile,
  editMode = false,
  hiddenKeys = [],
  labelMap = {},
  storageKey,
  onOrderChange,
  preferredOrder = [],
  savedOrder = null,
  mobileInitialCount = 4,
  onFieldChange,
  onFieldDelete,
}: MetaFactsProps) {
  const baseEntries = useMemo(() => {
    if (!metadata) return [] as Array<[string, unknown]>;
    return Object.entries(metadata).filter(
      ([k]) => !hiddenKeys.includes(k)
    );
  }, [metadata, hiddenKeys]);

  // default order: preferred keys first (in order), then alphabetical
  const defaultOrder = useMemo(() => {
    const orderIdx = new Map(preferredOrder.map((k, i) => [k, i]));
    return [...baseEntries]
      .sort(([a], [b]) => {
        const ia = orderIdx.has(a) ? (orderIdx.get(a) as number) : Infinity;
        const ib = orderIdx.has(b) ? (orderIdx.get(b) as number) : Infinity;
        if (ia !== ib) return ia - ib;
        return a.localeCompare(b);
      })
      .map(([k]) => k);
  }, [baseEntries, preferredOrder]);

  // load persisted order if available
  // Priority: 1) Database savedOrder, 2) localStorage, 3) defaultOrder
  const [order, setOrder] = useState<string[]>(defaultOrder);
  useEffect(() => {
    // Priority 1: Use database savedOrder if available
    if (savedOrder && savedOrder.length > 0) {
      const cleaned = savedOrder.filter((k) => baseEntries.some(([bk]) => bk === k));
      const missing = baseEntries
        .map(([k]) => k)
        .filter((k) => !cleaned.includes(k));
      setOrder([...cleaned, ...missing]);
      return;
    }

    // Priority 2: Fall back to localStorage
    if (!storageKey) return;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as string[];
      // keep only keys that still exist
      const cleaned = saved.filter((k) => baseEntries.some(([bk]) => bk === k));
      // and append any new keys at the end
      const missing = baseEntries
        .map(([k]) => k)
        .filter((k) => !cleaned.includes(k));
      setOrder([...cleaned, ...missing]);
    } catch {
      /* empty */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, baseEntries.length, savedOrder]); // re-run if set of keys changes or savedOrder changes

  // keep order in sync if metadata keys changed drastically (no storageKey)
  useEffect(() => {
    if (storageKey) return; // storage will handle
    setOrder(defaultOrder);
  }, [defaultOrder, storageKey]);

  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(order));
    onOrderChange?.(order);
  }, [order, storageKey, onOrderChange]);

  // items to render in current order
  const items = order
    .map((key) => baseEntries.find(([k]) => k === key))
    .filter(Boolean) as Array<[string, unknown]>;

  const [showAllMobile, setShowAllMobile] = useState(false);
  const visibleCount =
    isMobile && !showAllMobile
      ? Math.min(mobileInitialCount, items.length)
      : items.length;
  const visibleItems = items.slice(0, visibleCount);
  const hiddenCount = Math.max(items.length - visibleCount, 0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.findIndex((id) => id === active.id);
    const newIndex = order.findIndex((id) => id === over.id);
    setOrder((prev) => arrayMove(prev, oldIndex, newIndex));
  };

  if (items.length === 0 && !editMode) return null;

  return (
    <div className="mt-0">
      <div className="border-b mb-4 flex items-center text-lg font-semibold text-gray-900 dark:text-white">
        <IconMap.info className="inline h-5 w-5 text-gray-400 mr-2" />
        <h1>Quick Info</h1>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={visibleItems.map(([k]) => k)}
          strategy={verticalListSortingStrategy}
        >
          <dl
            id="metaFactsList"
            className={clsx(
              // desktop layout
              "sm:grid sm:grid-rows-4 sm:grid-flow-col sm:auto-cols-fr sm:gap-x-12 sm:gap-y-2",
              // dividers
              isMobile
                ? "divide-y divide-gray-200/70 dark:divide-white/10 border-b border-gray-200/70 dark:border-white/10"  // mobile only
                : "sm:divide-y-0" // disable parent divide on desktop
            )}
          >
            {visibleItems.map(([key, value]) => (
              <SortableRow
                key={key}
                id={key}
                label={labelMap[key] ?? humanize(key)}
                value={value}
                valueNode={renderValue(value)}
                editMode={editMode}
                onValueChange={(newValue) => onFieldChange?.(key, newValue)}
                onDelete={() => onFieldDelete?.(key)}
              />
            ))}
          </dl>
        </SortableContext>
      </DndContext>

      {/* Mobile-only toggle */}
      {isMobile && (hiddenCount > 0 || showAllMobile) && (
        <div className="mt-3 flex">
          <button
            type="button"
            onClick={() => setShowAllMobile((v) => !v)}
            aria-expanded={showAllMobile}
            aria-controls="metaFactsList"
            className="ml-auto inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium
                       hover:bg-gray-50 dark:hover:bg-white/10 dark:bg-white dark:text-black bg-black text-white"
          >
            {showAllMobile ? "Show less" : `Show more (${hiddenCount})`}
          </button>
        </div>
      )}
    </div>
  );
}

function SortableRow({
  id,
  label,
  value,
  valueNode,
  editMode = false,
  onValueChange,
  onDelete,
}: {
  id: string;
  label: string;
  value: unknown;
  valueNode: React.ReactNode;
  editMode?: boolean;
  onValueChange?: (newValue: string | string[]) => void;
  onDelete?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [isEditing, setIsEditing] = useState(false);
  const isArrayValue = Array.isArray(value);

  // For scalar values
  const [editValue, setEditValue] = useState(String(value ?? ""));

  // For array values
  const [arrayItems, setArrayItems] = useState<string[]>(
    isArrayValue ? value : []
  );
  const [newArrayItem, setNewArrayItem] = useState("");

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (isArrayValue) {
      onValueChange?.(arrayItems);
    } else {
      onValueChange?.(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (isArrayValue) {
      setArrayItems(Array.isArray(value) ? value : []);
      setNewArrayItem("");
    } else {
      setEditValue(String(value ?? ""));
    }
    setIsEditing(false);
  };

  const handleAddArrayItem = () => {
    if (newArrayItem.trim()) {
      setArrayItems([...arrayItems, newArrayItem.trim()]);
      setNewArrayItem("");
    }
  };

  const handleRemoveArrayItem = (index: number) => {
    setArrayItems(arrayItems.filter((_, i) => i !== index));
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`px-4 py-5 sm:grid sm:grid-cols-2 sm:gap-0 sm:px-0 sm:border-b sm:border-white/10 bg-white/0 ${
        isDragging
          ? "ring-2 ring-indigo-500 rounded-md bg-white/50 dark:bg-black/30"
          : ""
      }`}
    >
      <dt className="flex items-center gap-2 text-sm/8 font-medium text-[#738195]">
        {editMode && (
          <button
            aria-label="Drag handle"
            className="cursor-grab active:cursor-grabbing rounded p-1 hover:bg-gray-100 dark:hover:bg-white/10"
            {...listeners}
            {...attributes}
            type="button"
          >
            <IconMap.grid className="h-3 w-3 text-gray-400" />
          </button>
        )}
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-end text-sm/8 text-black dark:text-white sm:col-span-1 sm:mt-0 flex items-center justify-end gap-2">
        {editMode && isEditing ? (
          <>
            {isArrayValue ? (
              <div className="flex-1 flex flex-col gap-2">
                {/* Array items as bubbles/chips */}
                <div className="flex flex-wrap justify-end gap-1">
                  {arrayItems.map((item, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs bg-white dark:bg-gray-700"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveArrayItem(index)}
                        className="hover:text-red-600"
                        aria-label={`Remove ${item}`}
                      >
                        <IconMap.X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {/* Add new item input */}
                <div className="flex gap-1">
                  <input
                    type="text"
                    className="input input-bordered w-full text-sm text-black"
                    placeholder="Add item..."
                    value={newArrayItem}
                    onChange={(e) => setNewArrayItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddArrayItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddArrayItem}
                    className="btn btn-xs bg-blue-600 text-white hover:brightness-110"
                  >
                    <IconMap.add className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <input
                type="text"
                className="input input-bordered w-full text-sm text-black"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") handleCancel();
                }}
                autoFocus
              />
            )}
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-xs bg-green-600 text-white hover:brightness-110"
              >
                ✓
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-xs bg-gray-600 text-white hover:brightness-110"
              >
                ✕
              </button>
            </div>
          </>
        ) : (
          <>
            <span
              className={editMode ? "cursor-pointer hover:underline" : ""}
              onClick={() => editMode && setIsEditing(true)}
            >
              {valueNode}
            </span>
            {editMode && (
              <button
                type="button"
                onClick={onDelete}
                className="btn btn-xs bg-red-600 text-white hover:brightness-110"
                aria-label="Delete field"
              >
                <IconMap.trash className="h-3 w-3" />
              </button>
            )}
          </>
        )}
      </dd>
    </div>
  );
}