import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import type { Database } from "../../types/supabase";
import { supabase } from "../../supabaseClient";
import PhotoUpload from "./PhotoUpload";
import MetaFacts from "./MetaFacts";
import { EquipmentNavbar } from "./EquipmentNavbar";
import { useRole } from "../../RoleContext";
import { IconMap } from "../../data/icons";
import clsx from "clsx";
import EquipmentTabs from "./EquipmentTabs";
import LogsTab from "./LogsTab";
import GalleryTab from "./GalleryTab";
import SummaryTab from "./SummaryTab";
import FilesTab from "./FilesTab";
import { useStorageCache } from "../../utils/cache";

type EquipmentDetailsView = Database["public"]["Views"]["equipment_details"]["Row"];

// Extend the view type to include summary field from equipment table
type EquipmentDetails = EquipmentDetailsView & {
  summary: string | null;
};

interface SignedAttachment {
  id?: string;
  path: string; // the storage path we sign
  is_primary: boolean;
  uploaded_at?: string | null;
  signedUrl?: string; // result of createSignedUrls
}
const BUCKET = "equipment-attachments";

export default function EquipmentDetails() {
  const session = useSession();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [equipment, setEquipment] = useState<EquipmentDetails | null>(null);
  const [images, setImages] = useState<SignedAttachment[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const { isAdmin } = useRole();

  // Initialize storage cache for images
  const imageCache = useStorageCache(`storage:images:${id}`);

  // Auth guard - redirect to login if not authenticated
  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
    }
  }, [session, navigate]);

  // Return early if not authenticated (prevents flash of content)
  if (!session) {
    return null;
  }

  // check if device is a mobile device
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    // Desktop threshold: 1024px (Tailwind lg)
    const mq = window.matchMedia("(max-width: 1023.98px)");
    const update = () => setIsMobile(mq.matches);

    update(); // set initial value
    if (mq.addEventListener) {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
  }, []);

  const fetchEquipmentDetails = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("equipment_details")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching equipment: ", error.message);
    } else {
      // Also fetch summary from equipment table since view doesn't include it
      const { data: equipmentData } = await supabase
        .from("equipment")
        .select("summary")
        .eq("id", id)
        .single();

      setEquipment({
        ...data,
        summary: equipmentData?.summary || null
      } as EquipmentDetails);
    }

    // Fetch attachments directly from attachments table instead of view
    // This ensures we get fresh is_primary values
    const { data: attachmentsData, error: attachmentsError } = await supabase
      .from("attachments")
      .select("*")
      .eq("equipment_id", id)
      .order("uploaded_at", { ascending: false });

    if (attachmentsError) {
      console.error("Error fetching attachments:", attachmentsError.message);
      setImages([]);
      return;
    }

    if (!attachmentsData || attachmentsData.length === 0) {
      setImages([]);
      return;
    }

    const paths = attachmentsData.map((att) => att.url).filter((url): url is string => url !== null);

    // Check cache first
    let urlMap = imageCache.getCachedUrls(paths);

    // If not all URLs are cached, fetch from Supabase
    if (!urlMap) {
      const { data: signedList, error: signErr } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(paths, 3600); // 1 hour expiry

      if (signErr) {
        console.error("createSignedUrls error:", signErr.message);
        setImages([]);
        return;
      }

      urlMap = new Map(
        signedList
          .filter((x) => x.path !== null)
          .map((x) => [x.path as string, x.signedUrl])
      );

      // Cache the newly fetched URLs
      imageCache.setCachedUrls(urlMap);
    }

    const withUrls = attachmentsData.map((attachment) => ({
      id: attachment.id,
      path: attachment.url,
      is_primary: attachment.is_primary,
      uploaded_at: attachment.uploaded_at,
      signedUrl: urlMap!.get(attachment.url),
    }));

    setImages(withUrls);
  }, [id, imageCache]);

  const primaryUrl = images.find((i) => i.is_primary)?.signedUrl;

  useEffect(() => {
    if (!id) return;
    fetchEquipmentDetails();
  }, [id, fetchEquipmentDetails]);

  // Metadata handlers
  const handleFieldChange = useCallback(
    async (key: string, newValue: string | string[]) => {
      if (!id) return;
      try {
        // The RPC function accepts JSONB, so we pass the value as-is
        // Arrays will be stored as JSON arrays, strings as JSON strings
        const { error } = await supabase.rpc("equipment_upsert_metadata", {
          p_equipment_id: id,
          p_key: key,
          p_value: newValue,
        });
        if (error) throw error;
        // Refetch to get updated data
        await fetchEquipmentDetails();
      } catch (error) {
        console.error("Error updating metadata:", error);
        alert("Failed to update field. Please try again.");
      }
    },
    [id, fetchEquipmentDetails]
  );

  const handleFieldDelete = useCallback(
    async (key: string) => {
      if (!id) return;
      if (!confirm(`Are you sure you want to delete the "${key}" field?`))
        return;
      try {
        const { error } = await supabase.rpc("equipment_delete_metadata_key", {
          p_equipment_id: id,
          p_key: key,
        });
        if (error) throw error;
        // Refetch to get updated data
        await fetchEquipmentDetails();
      } catch (error) {
        console.error("Error deleting metadata:", error);
        alert("Failed to delete field. Please try again.");
      }
    },
    [id, fetchEquipmentDetails]
  );

  const handleFieldAdd = useCallback(
    async (key: string, value: string | string[]) => {
      if (!id) return;
      try {
        const { error } = await supabase.rpc("equipment_upsert_metadata", {
          p_equipment_id: id,
          p_key: key,
          p_value: value,
        });
        if (error) throw error;
        // Refetch to get updated data
        await fetchEquipmentDetails();
      } catch (error) {
        console.error("Error adding metadata:", error);
        alert("Failed to add field. Please try again.");
      }
    },
    [id, fetchEquipmentDetails]
  );

  const handleAddFieldClick = useCallback(() => {
    if (!newFieldKey.trim() || !newFieldValue.trim()) return;

    const key = newFieldKey.trim();
    const value = newFieldValue.trim();

    // Detect comma-separated values and convert to array
    const hasComma = value.includes(",");

    if (hasComma) {
      // Split by comma, trim each item, filter out empty strings
      const arrayValue = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      handleFieldAdd(key, arrayValue);
    } else {
      handleFieldAdd(key, value);
    }

    // Clear form
    setNewFieldKey("");
    setNewFieldValue("");
  }, [newFieldKey, newFieldValue, handleFieldAdd]);

  const handleOrderChange = useCallback(
    async (orderedKeys: string[]) => {
      if (!id) return;
      try {
        const { error } = await supabase.rpc("equipment_set_metadata_order", {
          p_equipment_id: id,
          p_order: orderedKeys,
        });
        if (error) throw error;
      } catch (error) {
        console.error("Error updating metadata order:", error);
      }
    },
    [id]
  );

  const handleCancelEdit = useCallback(async () => {
    // Refetch data from database to discard any local changes
    await fetchEquipmentDetails();
    // Exit edit mode
    setEditMode(false);
  }, [fetchEquipmentDetails]);
  if (!equipment)
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-xl dark:text-white"></span>
      </div>
    );
  return (
    <>
      <EquipmentNavbar
        isMobile={isMobile}
        title={equipment.name as string}
        subtitle={equipment.description as string}
        onEdit={() => setEditMode(!editMode)}
        onCancel={handleCancelEdit}
        showEdit={isAdmin}
        editMode={editMode}
        maxWidthClass="mx-auto"
      />
      <div
        className={clsx(
          { "mx-16 mt-6": !isMobile },
          "sm:grid sm:grid-cols-3 sm:gap-30 p-9 overflow-hidden rounded-2xl border shadow-sm transition dark:bg-gray-800",
          editMode
            ? "border-blue-400 bg-blue-50/50 ring-2 ring-blue-400/50 dark:border-blue-500 dark:bg-blue-950/20 dark:ring-blue-500/50"
            : "border-gray-200 bg-white hover:shadow-md focus-within:shadow-md dark:border-gray-800"
        )}
      >
        <div className="mt-6 sm:col-span-1 min-h-0">
          <PhotoUpload
            equipmentId={equipment.id}
            onUploaded={() => {
              imageCache.clearCache(); // Clear cache when new photo uploaded
              fetchEquipmentDetails();
            }}
            primaryUrl={primaryUrl}
            editMode={editMode}
          />
        </div>
        <div
          className={clsx(
            { "mt-6": isMobile },
            "sm:col-span-2 min-h-0 overflow-y-auto overflow-x-hidden"
          )}
        >
          <MetaFacts
            isMobile={isMobile}
            metadata={Object.fromEntries(
              Object.entries(
                equipment.metadata as Record<string, unknown>
              ).filter(
                // filter out type_id
                ([key]) => key !== "type_id"
              )
            )}
            editMode={editMode}
            savedOrder={equipment.metadata_order as string[] | null}
            storageKey={`equipment:${equipment.id}:metaOrder`}
            preferredOrder={[
              "model",
              "manufacturer",
              "diameter",
              "material",
              "installation_year",
            ]}
            labelMap={{
              installation_year: "Installed",
              SSN: "SSID",
              "service size": "Service Size",
            }}
            onOrderChange={handleOrderChange}
            onFieldChange={handleFieldChange}
            onFieldDelete={handleFieldDelete}
            onFieldAdd={handleFieldAdd}
          />

          {/* Add new field form (edit mode only) - Moved outside MetaFacts to prevent overflow */}
          {editMode && (
            <div className="mt-6 flex gap-2 items-center">
              <input
                type="text"
                className="input input-bordered w-40 text-sm"
                placeholder="Key (e.g., Model)"
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFieldClick();
                }}
              />
              <input
                type="text"
                className="input input-bordered flex-1 text-sm"
                placeholder="Value (comma-separated for lists)"
                value={newFieldValue}
                onChange={(e) => setNewFieldValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddFieldClick();
                }}
              />
              <button
                type="button"
                onClick={handleAddFieldClick}
                className="btn btn-sm bg-[#2f6ea8] text-white hover:brightness-110 flex items-center gap-1"
              >
                <IconMap.add className="h-4 w-4" />
                Add
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Section */}
      {equipment.id && (
        <div
          className={clsx(
            { "mx-16": !isMobile },
            "mt-6 mb-8"
          )}
        >
          <EquipmentTabs>
            {(activeTab) => {
              switch (activeTab) {
                case "logs":
                  return <LogsTab equipmentId={equipment.id as string} isAdmin={isAdmin} editMode={editMode} />;
                case "gallery":
                  return (
                    <GalleryTab
                      equipmentId={equipment.id as string}
                      isAdmin={isAdmin}
                      editMode={editMode}
                      onImageDeleted={fetchEquipmentDetails}
                    />
                  );
                case "summary":
                  return (
                    <SummaryTab
                      equipmentId={equipment.id as string}
                      initialSummary={equipment.summary || null}
                      isAdmin={isAdmin}
                      editMode={editMode}
                      onSummaryUpdate={fetchEquipmentDetails}
                    />
                  );
                case "files":
                  return (
                    <FilesTab
                      equipmentId={equipment.id as string}
                      isAdmin={isAdmin}
                      editMode={editMode}
                    />
                  );
                default:
                  return null;
              }
            }}
          </EquipmentTabs>
        </div>
      )}
    </>
  );
}
