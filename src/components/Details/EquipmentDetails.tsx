import { useParams } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import type { Database } from "../../types/supabase";
import { supabase } from "../../supabaseClient";
import PhotoUpload from "./PhotoUpload";
import MetaFacts from "./MetaFacts";
import { EquipmentNavbar } from "./EquipmentNavbar";
import clsx from "clsx";

type EquipmentDetails = Database["public"]["Views"]["equipment_details"]["Row"];
type RawAttachment = Database["public"]["Tables"]["attachments"]["Update"];

interface SignedAttachment {
  id?: string;
  path: string; // the storage path we sign
  is_primary: boolean;
  uploaded_at?: string | null;
  signedUrl?: string; // result of createSignedUrls
}
const BUCKET = "equipment-attachments";
function normalizeAttachments(raw: unknown): SignedAttachment[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawAttachment[])
    .map((attachment) => {
      if (typeof attachment === "string") {
        // If the view returns a bare string, treat it as the path
        return { path: attachment };
      }
      const path = attachment?.url ?? "";
      if (!path) return null; // ignore malformed rows
      return {
        id: attachment.id,
        path,
        is_primary: attachment.is_primary ?? null,
        uploaded_at: attachment.uploaded_at ?? null,
      };
    })
    .filter(Boolean) as SignedAttachment[];
}

export default function EquipmentDetails() {
  const { id } = useParams<{ id: string }>();
  const [equipment, setEquipment] = useState<EquipmentDetails | null>(null);
  const [images, setImages] = useState<SignedAttachment[]>([]);
  const [isMobile, setIsMobile] = useState(false);

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
      setEquipment(data as EquipmentDetails);
    }

    const normalized = normalizeAttachments(
      (data as EquipmentDetails).attachments
    );

    const paths = normalized
      .map((attachment) => attachment.path)
      .filter(Boolean);

    if (paths.length === 0) {
      setImages([]);
      // loading logic for later maybe
      return;
    }

    const { data: signedList, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrls(paths, 3600); // 1 hour expiry; adjust as needed

    if (signErr) {
      console.error("createSignedUrls error:", signErr.message);
      setImages(normalized); // fall back: show without URL (renders placeholders)
      // setLoading(false);
      return;
    }

    const byPath = new Map(signedList.map((x) => [x.path, x.signedUrl]));
    const withUrls = normalized.map((attachment) => ({
      ...attachment,
      signedUrl: byPath.get(attachment.path),
    }));

    setImages(withUrls);
  }, [id]);

  const primaryUrl =
    images.find((i) => i.is_primary)?.signedUrl ?? images[0]?.signedUrl;

  useEffect(() => {
    if (!id) return;
    fetchEquipmentDetails();
  }, [id, fetchEquipmentDetails]);
  if (!equipment)
    return (
      <div className="flex items-center justify-center h-screen">
        <span className="loading loading-spinner loading-xl dark:text-white"></span>
      </div>
    );
  return (
    <>
      {/* <Navbar /> */}
      <EquipmentNavbar
        isMobile={isMobile}
        title={equipment.name as string}
        subtitle={equipment.description as string}
        onEdit={() => console.log("edit")}
        showEdit
        // Match your page container width here (pick the one you use most)
        maxWidthClass="mx-auto"
      />
      <div
        className={clsx(
          { "mx-16 mt-6": !isMobile },
          "sm:grid sm:grid-cols-3 sm:gap-30 p-9 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md focus-within:shadow-md dark:border-gray-800 dark:bg-gray-800"
        )}
      >
        <div className="mt-6 sm:col-span-1 min-h-0">
          <PhotoUpload
            equipmentId={equipment.id}
            onUploaded={() => {
              fetchEquipmentDetails();
            }}
            primaryUrl={primaryUrl}
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
            // TODO: persist to Supabase user settings
            onOrderChange={(ordered) => {
              console.log("New order:", ordered);
            }}
          />
        </div>
      </div>
    </>
  );
}
