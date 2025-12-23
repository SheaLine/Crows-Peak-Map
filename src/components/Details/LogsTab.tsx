import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import type { Database } from "../../types/supabase";
import { IconMap } from "../../data/icons";
import { useDataCache } from "../../utils/cache";

type ServiceLog = Database["public"]["Tables"]["service_logs"]["Row"];

interface LogsTabProps {
  equipmentId: string;
  isAdmin: boolean;
  editMode: boolean;
}

export default function LogsTab({ equipmentId, isAdmin, editMode }: LogsTabProps) {
  const [logs, setLogs] = useState<ServiceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Initialize data cache for logs
  const logsCache = useDataCache<ServiceLog[]>(`data:logs:${equipmentId}`);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formDate, setFormDate] = useState(() => {
    // Default to today
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [submitting, setSubmitting] = useState(false);

  const LOGS_PER_PAGE = 10;

  const fetchLogs = useCallback(async (offset = 0) => {
    try {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);

      // Check cache only for first page
      if (offset === 0) {
        const cachedLogs = logsCache.getCachedData();
        if (cachedLogs) {
          setLogs(cachedLogs);
          setHasMore(cachedLogs.length === LOGS_PER_PAGE);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await supabase
        .from("service_logs")
        .select("*")
        .eq("equipment_id", equipmentId)
        .order("happened_at", { ascending: false })
        .range(offset, offset + LOGS_PER_PAGE - 1);

      if (error) throw error;

      if (offset === 0) {
        setLogs(data || []);
        // Cache first page only
        logsCache.setCachedData(data || []);
      } else {
        setLogs((prev) => [...prev, ...(data || [])]);
      }

      setHasMore(data?.length === LOGS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching logs:", error);
      alert("Failed to load logs. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [equipmentId, logsCache]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert("Please enter a title");
      return;
    }

    setSubmitting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const { error } = await supabase.from("service_logs").insert({
        equipment_id: equipmentId,
        title: formTitle.trim(),
        body: formBody.trim() || null,
        happened_at: new Date(formDate).toISOString(),
        created_by: userData.user.id,
      });

      if (error) throw error;

      // Reset form and close modal
      setFormTitle("");
      setFormBody("");
      setFormDate(new Date().toISOString().split("T")[0]);
      setShowModal(false);

      // Clear cache and refresh logs
      logsCache.clearCache();
      await fetchLogs();
    } catch (error) {
      console.error("Error adding log:", error);
      alert("Failed to add log. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (log: ServiceLog) => {
    if (!confirm(`Are you sure you want to delete the log "${log.title}"?`)) return;

    try {
      const { error } = await supabase
        .from("service_logs")
        .delete()
        .eq("id", log.id);

      if (error) throw error;

      // Clear cache and refresh logs
      logsCache.clearCache();
      await fetchLogs();
    } catch (error) {
      console.error("Error deleting log:", error);
      alert("Failed to delete log. Please try again.");
    }
  };

  const handleLoadMore = () => {
    fetchLogs(logs.length);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg text-[#2f6ea8]"></span>
      </div>
    );
  }

  return (
    <div>
      {/* Header with Add Button */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Service Logs
        </h2>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2f6ea8] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] transition-colors"
          >
            <IconMap.add className="h-4 w-4" />
            Add Log
          </button>
        )}
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <IconMap.list className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No service logs yet
          </p>
          {isAdmin && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Click "Add Log" to create the first entry
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => (
            <LogCard
              key={log.id}
              log={log}
              isAdmin={isAdmin}
              editMode={editMode}
              onDelete={() => handleDeleteLog(log)}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {loadingMore ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Loading...
                  </>
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Log Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Add Service Log
              </h3>
            </div>
            <form onSubmit={handleAddLog}>
              <div className="space-y-4 p-6">
                {/* Title */}
                <div>
                  <label
                    htmlFor="log-title"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Title *
                  </label>
                  <input
                    id="log-title"
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Annual maintenance"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2f6ea8] focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Date */}
                <div>
                  <label
                    htmlFor="log-date"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Date *
                  </label>
                  <input
                    id="log-date"
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2f6ea8] focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Body */}
                <div>
                  <label
                    htmlFor="log-body"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Notes
                  </label>
                  <textarea
                    id="log-body"
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    rows={4}
                    placeholder="Detailed notes about the service..."
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#2f6ea8] focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2f6ea8] px-4 py-2 text-sm font-semibold text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function LogCard({
  log,
  isAdmin,
  editMode,
  onDelete,
}: {
  log: ServiceLog;
  isAdmin: boolean;
  editMode: boolean;
  onDelete: () => void;
}) {
  const formattedDate = new Date(log.happened_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div data-testid="log-entry" className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Delete Button - Only show in edit mode for admins */}
      {isAdmin && editMode && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-2 right-2 rounded-lg bg-red-600 p-2 text-white shadow hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-red-600"
          aria-label="Delete log"
        >
          <IconMap.trash className="h-4 w-4" />
        </button>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1 pr-10">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {log.title}
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formattedDate}
          </p>
        </div>
      </div>
      {log.body && (
        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {log.body}
        </p>
      )}
    </div>
  );
}
