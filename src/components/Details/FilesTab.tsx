import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import type { Database } from "../../types/supabase";
import { IconMap } from "../../data/icons";
import { v4 as uuidv4 } from "uuid";
import { useStorageCache } from "../../utils/cache";

type Attachment = Database["public"]["Tables"]["attachments"]["Row"];

interface FilesTabProps {
  equipmentId: string;
  isAdmin: boolean;
  editMode: boolean;
}

const BUCKET = "equipment-attachments";

export default function FilesTab({
  equipmentId,
  isAdmin,
  editMode,
}: FilesTabProps) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Initialize storage cache for files
  const fileCache = useStorageCache(`storage:files:${equipmentId}`);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("equipment_id", equipmentId)
        .eq("is_image", false)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      setFiles(data || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      alert("Failed to load files. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(selectedFiles).map(async (file) => {
        // Skip image files (they go to gallery)
        if (file.type.startsWith("image/")) {
          console.warn(`Skipping image file: ${file.name}`);
          return;
        }

        // Generate unique filename
        const ext = file.name.split(".").pop() || "file";
        const path = `equipment/${equipmentId}/${uuidv4()}.${ext}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false });

        if (uploadError) throw uploadError;

        // Insert attachment record
        const { error: insertError } = await supabase
          .from("attachments")
          .insert({
            equipment_id: equipmentId,
            url: path,
            file_type: file.type,
            label: file.name,
            is_primary: false,
            file_size: file.size,
          });

        if (insertError) throw insertError;
      });

      await Promise.all(uploadPromises);

      // Clear cache and refresh files
      fileCache.clearCache();
      await fetchFiles();
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload some files. Please try again.");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDownload = async (file: Attachment) => {
    try {
      // Check cache first
      let urlMap = fileCache.getCachedUrls([file.url]);
      let signedUrl: string;

      if (urlMap) {
        signedUrl = urlMap.get(file.url)!;
      } else {
        // Fetch new signed URL if not cached
        const { data, error } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(file.url, 3600); // 1 hour expiry

        if (error) throw error;

        signedUrl = data.signedUrl;

        // Cache the URL
        fileCache.setCachedUrls(new Map([[file.url, signedUrl]]));
      }

      // Open in new tab
      window.open(signedUrl, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      alert("Failed to download file. Please try again.");
    }
  };

  const handleDelete = async (file: Attachment) => {
    if (!confirm(`Are you sure you want to delete "${file.label}"?`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([file.url]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("attachments")
        .delete()
        .eq("id", file.id);

      if (dbError) throw dbError;

      // Clear cache and refresh files
      fileCache.clearCache();
      await fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Failed to delete file. Please try again.");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return IconMap.attachment;
    if (fileType.includes("pdf")) return IconMap.document;
    return IconMap.attachment;
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
      {/* Header with Upload Button */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Files
        </h2>
        {isAdmin && editMode && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#2f6ea8] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] transition-colors">
            <IconMap.add className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Files"}
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <IconMap.attachment className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No files yet
          </p>
          {isAdmin && editMode && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Click "Upload Files" to add documents
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {files.map((file) => {
            const FileIcon = getFileIcon(file.file_type);
            const uploadDate = file.uploaded_at
              ? new Date(file.uploaded_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Unknown date";

            return (
              <div
                key={file.id}
                className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                    <FileIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>

                {/* File Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium text-gray-900 dark:text-white">
                    {file.label || "Untitled"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.file_size)} • {uploadDate}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownload(file)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                    title="Download"
                  >
                    Download
                  </button>
                  {isAdmin && editMode && (
                    <button
                      type="button"
                      onClick={() => handleDelete(file)}
                      className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-red-600"
                      title="Delete"
                    >
                      <IconMap.trash className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
