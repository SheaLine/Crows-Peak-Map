import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { IconMap } from "../../data/icons";
import { useDataCache } from "../../utils/cache";

interface SummaryTabProps {
  equipmentId: string;
  initialSummary: string | null;
  isAdmin: boolean;
  editMode: boolean;
  onSummaryUpdate?: () => void;
}

export default function SummaryTab({
  equipmentId,
  initialSummary,
  isAdmin,
  editMode,
  onSummaryUpdate,
}: SummaryTabProps) {
  const [summary, setSummary] = useState(initialSummary || "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Initialize data cache for summary
  const summaryCache = useDataCache<string>(`data:summary:${equipmentId}`);

  // Check cache on mount, or use initialSummary
  // Only reset when equipmentId changes, not on every render
  useEffect(() => {
    const cachedSummary = summaryCache.getCachedData();
    if (cachedSummary !== null) {
      setSummary(cachedSummary);
    } else {
      setSummary(initialSummary || "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("equipment")
        .update({ summary: summary.trim() || null })
        .eq("id", equipmentId);

      if (error) throw error;

      // Update cache with saved summary
      summaryCache.setCachedData(summary.trim());
      setLastSaved(new Date());
      onSummaryUpdate?.();
    } catch (error) {
      console.error("Error saving summary:", error);
      alert("Failed to save summary. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Summary
        </h2>
        {isAdmin && editMode && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2f6ea8] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>
                <IconMap.save className="h-4 w-4" />
                Save Summary
              </>
            )}
          </button>
        )}
      </div>

      {/* Last saved timestamp */}
      {lastSaved && (
        <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          Last saved: {lastSaved.toLocaleTimeString()}
        </div>
      )}

      {/* Content */}
      {editMode && isAdmin ? (
        <div>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={12}
            placeholder="Enter a detailed summary of this equipment..."
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#2f6ea8] focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Click "Save Summary" to save your changes
          </p>
        </div>
      ) : (
        <div>
          {summary && summary.trim() !== "" ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {summary}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
              <IconMap.document className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                No summary available
              </p>
              {isAdmin && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                  Enter edit mode to add a summary
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
