import { IconMap } from "../../data/icons";
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { v4 as uuidv4 } from "uuid";

interface PhotoUploadProps {
  equipmentId: string | null;
  onUploaded?: () => void;
  primaryUrl: string | undefined;
  editMode?: boolean;
}

export default function PhotoUpload({
  equipmentId,
  onUploaded,
  primaryUrl,
  editMode = false,
}: PhotoUploadProps) {
  const BUCKET = "equipment-attachments";
  const MAX_SIZE_MB = 1000;
  const ACCEPTED = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ];

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!ACCEPTED.includes(file.type)) {
      setError("Unsupported file type.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Optional: show local preview
    setPreview(URL.createObjectURL(file));

    setUploading(true);
    try {
      // Path: equipment/<equipment_id>/<uuid>.<ext>
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filename = `${uuidv4()}.${ext}`;
      const path = `equipment/${equipmentId}/${filename}`;

      // 1) Upload to Storage (private bucket)
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
          cacheControl: "3600",
        });

      if (upErr) throw upErr;

      // 2) Set all existing photos for this equipment to is_primary = false
      if (equipmentId) {
        const { error: updateErr } = await supabase
          .from("attachments")
          .update({ is_primary: false })
          .eq("equipment_id", equipmentId);

        if (updateErr) throw updateErr;
      }

      // 3) Insert row into attachments as primary photo
      const { error: insErr } = await supabase.from("attachments").insert({
        equipment_id: equipmentId,
        url: path, // store path; use signed URLs when displaying
        file_type: file.type,
        is_primary: true, // This photo becomes the hero photo
        // uploaded_at will default to now()
      });

      if (insErr) throw insErr;

      // 4) Notify parent to refresh
      onUploaded?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message ?? "Upload failed");
      } else {
        setError("Upload failed");
      }
    } finally {
      setUploading(false);
      // optional: reset input
      if (e.currentTarget) {
        e.currentTarget.value = "";
      }
    }
  }

  return (
    <>
      <figure className="w-full mb-2 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-gray-200 shadow-sm dark:bg-gray-900/20 dark:ring-gray-700">
        {preview ? (
          <img
            src={preview}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        ) : primaryUrl ? (
          <img
            src={primaryUrl}
            alt="No photo of equipment uploaded"
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src="/your-photo.jpg"
            alt="No photo of equipment uploaded"
            className="h-full w-full object-cover"
          />
        )}
      </figure>

      {editMode && (
        <>
          <label
            htmlFor="upload-photo"
            className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl
                       border-2 border-dashed border-sky-300 bg-white/70 px-4 py-3 text-sm font-medium text-sky-700
                       shadow-sm transition hover:border-sky-400 hover:bg-sky-50 focus:outline-none
                       focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2
                       dark:border-sky-400/40 dark:bg-sky-400/10 dark:text-sky-300 dark:hover:bg-sky-400/20"
          >
            <IconMap.Camera />
            {uploading ? "Uploading..." : "Upload New Photo"}
          </label>
          <input
            id="upload-photo"
            type="file"
            accept={ACCEPTED.join(",")}
            className="sr-only"
            disabled={uploading}
            onChange={handleFileChange}
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </>
      )}
    </>
  );
}
