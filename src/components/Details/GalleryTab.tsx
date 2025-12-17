import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import type { Database } from "../../types/supabase";
import { IconMap } from "../../data/icons";
import { v4 as uuidv4 } from "uuid";
import { useStorageCache } from "../../utils/cache";

type Attachment = Database["public"]["Tables"]["attachments"]["Row"];

interface GalleryTabProps {
  equipmentId: string;
  isAdmin: boolean;
  editMode: boolean;
  onImageDeleted?: () => void;
}

interface SignedImage extends Attachment {
  signedUrl?: string;
}

const BUCKET = "equipment-attachments";

export default function GalleryTab({
  equipmentId,
  isAdmin,
  editMode,
  onImageDeleted,
}: GalleryTabProps) {
  const [images, setImages] = useState<SignedImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Initialize storage cache for gallery images
  const imageCache = useStorageCache(`storage:images:${equipmentId}`);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("attachments")
        .select("*")
        .eq("equipment_id", equipmentId)
        .eq("is_image", true)
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setImages([]);
        setLoading(false);
        return;
      }

      // Get signed URLs for all images
      const paths = data.map((img) => img.url).filter((url): url is string => url !== null);

      // Check cache first
      let urlMap = imageCache.getCachedUrls(paths);

      // If not all URLs are cached, fetch from Supabase
      if (!urlMap) {
        const { data: signedList, error: signErr } = await supabase.storage
          .from(BUCKET)
          .createSignedUrls(paths, 3600);

        if (signErr) throw signErr;

        urlMap = new Map(
          signedList
            .filter((x) => x.path !== null)
            .map((x) => [x.path as string, x.signedUrl])
        );

        // Cache the newly fetched URLs
        imageCache.setCachedUrls(urlMap);
      }

      const withUrls = data.map((img) => ({
        ...img,
        signedUrl: urlMap!.get(img.url),
      }));

      // Sort: primary first, then by upload date descending
      const sorted = withUrls.sort((a, b) => {
        // Primary photos come first
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        // Then sort by upload date (already sorted from query, but maintain it)
        return 0;
      });

      setImages(sorted);
    } catch (error) {
      console.error("Error fetching images:", error);
      alert("Failed to load images. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [equipmentId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          console.warn(`Skipping non-image file: ${file.name}`);
          return;
        }

        // Generate unique filename
        const ext = file.name.split(".").pop() || "jpg";
        const path = `equipment/${equipmentId}/${uuidv4()}.${ext}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, {
            upsert: false,
            contentType: file.type,
            cacheControl: "3600",
          });

        if (uploadError) throw uploadError;

        // Insert attachment record (is_primary = false for gallery images)
        const { error: insertError } = await supabase
          .from("attachments")
          .insert({
            equipment_id: equipmentId,
            url: path,
            file_type: file.type,
            label: file.name,
            is_primary: false,
          });

        if (insertError) throw insertError;
      });

      await Promise.all(uploadPromises);

      // Clear cache and refresh images
      imageCache.clearCache();
      await fetchImages();
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload some images. Please try again.");
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (image: SignedImage) => {
    if (!confirm(`Are you sure you want to delete this image?${image.is_primary ? '\n\nNote: This is your hero photo.' : ''}`)) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .remove([image.url]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("attachments")
        .delete()
        .eq("id", image.id);

      if (dbError) throw dbError;

      // Clear cache and refresh gallery
      imageCache.clearCache();
      await fetchImages();

      // Notify parent to refresh (for hero photo update)
      onImageDeleted?.();
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Failed to delete image. Please try again.");
    }
  };

  const handleMakePrimary = async (image: SignedImage) => {
    try {
      // Set all photos to is_primary = false
      const { error: updateAllErr } = await supabase
        .from("attachments")
        .update({ is_primary: false })
        .eq("equipment_id", equipmentId);

      if (updateAllErr) throw updateAllErr;

      // Set selected photo to is_primary = true
      const { error: setPrimaryErr } = await supabase
        .from("attachments")
        .update({ is_primary: true })
        .eq("id", image.id);

      if (setPrimaryErr) throw setPrimaryErr;

      // Refresh gallery
      await fetchImages();

      // Notify parent to refresh (for hero photo update)
      onImageDeleted?.();
    } catch (error) {
      console.error("Error setting primary image:", error);
      alert("Failed to set primary image. Please try again.");
    }
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
          Gallery
        </h2>
        {isAdmin && editMode && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#2f6ea8] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] transition-colors">
            <IconMap.Camera className="h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Images"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Image Grid */}
      {images.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/50">
          <IconMap.image className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            No images yet
          </p>
          {isAdmin && editMode && (
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Click "Upload Images" to add photos
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <div key={image.id} className="relative">
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="group relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2f6ea8] dark:bg-gray-800"
              >
                {image.signedUrl ? (
                  <img
                    src={image.signedUrl}
                    alt={image.label || "Equipment photo"}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <IconMap.image className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                {/* Primary badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 rounded-full bg-[#2f6ea8] px-2 py-1 text-xs font-semibold text-white shadow">
                    Primary
                  </div>
                )}
              </button>

              {/* Delete Button - Only show in edit mode for admins */}
              {isAdmin && editMode && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(image);
                  }}
                  className="absolute top-2 right-2 rounded-lg bg-red-600 p-2 text-white shadow hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-red-600"
                  aria-label="Delete image"
                >
                  <IconMap.trash className="h-3 w-3" />
                </button>
              )}

              {/* Make Primary Button - Only show in edit mode for admins and hide if already primary */}
              {isAdmin && editMode && !image.is_primary && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMakePrimary(image);
                  }}
                  className="mt-2 w-full rounded-lg bg-[#2f6ea8] px-3 py-2 text-xs font-semibold text-white shadow hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#2f6ea8]"
                >
                  Make Primary
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNext={() =>
            setLightboxIndex((prev) =>
              prev !== null ? (prev + 1) % images.length : 0
            )
          }
          onPrev={() =>
            setLightboxIndex((prev) =>
              prev !== null ? (prev - 1 + images.length) % images.length : 0
            )
          }
        />
      )}
    </div>
  );
}

interface LightboxProps {
  images: SignedImage[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

function Lightbox({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrev,
}: LightboxProps) {
  const currentImage = images[currentIndex];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      {/* Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Close"
      >
        <IconMap.X className="h-6 w-6" />
      </button>

      {/* Previous Button */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={onPrev}
          className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Previous image"
        >
          <IconMap.back className="h-6 w-6 rotate-90" />
        </button>
      )}

      {/* Image */}
      <div className="max-h-full max-w-full">
        {currentImage.signedUrl ? (
          <img
            src={currentImage.signedUrl}
            alt={currentImage.label || "Equipment photo"}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
          />
        ) : (
          <div className="flex h-64 w-64 items-center justify-center rounded-lg bg-gray-800">
            <IconMap.image className="h-16 w-16 text-gray-600" />
          </div>
        )}
        {/* Image Info */}
        <div className="mt-4 text-center text-white">
          <p className="text-sm">
            {currentIndex + 1} / {images.length}
          </p>
          {currentImage.label && (
            <p className="mt-1 text-xs text-gray-400">{currentImage.label}</p>
          )}
        </div>
      </div>

      {/* Next Button */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={onNext}
          className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Next image"
        >
          <IconMap.back className="h-6 w-6 -rotate-90" />
        </button>
      )}
    </div>
  );
}
