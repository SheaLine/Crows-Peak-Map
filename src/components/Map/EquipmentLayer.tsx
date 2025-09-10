import { useEffect, useState, useRef } from "react";
import { Marker, Tooltip, Popup } from "react-leaflet";
import { supabase } from "../../supabaseClient";
import type { Database } from "../../types/supabase";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import type { IconType } from "react-icons";
import { IconMap } from "../../data/icons";
import ReactDOMServer from "react-dom/server";

// gets the types from the database schema, updated when changed are made automatically
// alternatively, we could manually define the type here, but would have to update manually
//type Equipment = {
//     created_at: string | null;
//     description: string | null;
//     id: string;
//     lat: number;
//     lng: number;
//     metadata: Json;
//     name: string;
//     type_id: number;
// }
export type Equipment = Database["public"]["Tables"]["equipment"]["Row"];

interface EquipmentLayerProps {
  filters: number[];
  typeMap: Record<number, { displayName: string; icon: string; color: string }>;
  search: string;
}

export default function EquipmentLayer({
  filters,
  typeMap,
  search,
}: EquipmentLayerProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const navigate = useNavigate();
  const iconCacheRef = useRef(new Map<string, L.DivIcon>());
  const ICON_SIZE = 30;

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

  useEffect(() => {
    const fetchEquipment = async () => {
      const { data, error } = await supabase.from("equipment").select("*");
      if (error) {
        console.error("Error fetching equipment:", error.message);
      } else {
        // console.log("Fetched equipment data:", data);
        setEquipment(data as Equipment[]);
      }
    };
    fetchEquipment();
  }, []);

  const term = search.trim().toLowerCase();

  const filteredEquipment = equipment
    .filter((eq) => (filters.length ? filters.includes(eq.type_id) : equipment))
    .filter((eq) =>
      term ? (eq.name ?? "").toLowerCase().startsWith(term) : equipment
    );

  // changes react icon component to leaflet div icon
  // with caching to avoid re-rendering the same icon multiple times
  function getDivIcon(IconCmp: IconType, color: string, size = ICON_SIZE) {
    const cacheKey = `${IconCmp.name}:${color}:${size}`;
    const iconCache = iconCacheRef.current;
    const cachedIcon = iconCache.get(cacheKey);
    // console.log("Cache key:", cacheKey);
    if (cachedIcon) return cachedIcon;

    const svg = ReactDOMServer.renderToStaticMarkup(
      <IconCmp style={{ color, width: size, height: size }} />
    );

    const icon = L.divIcon({
      className: "custom-marker",
      html: `<div class="marker-inner">${svg}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size / 2],
    });

    iconCache.set(cacheKey, icon);
    return icon;
  }

  // Don’t render markers until we have a type map
  if (!typeMap || Object.keys(typeMap).length === 0) return null;
  console.log(isMobile);
  return (
    <>
      {filteredEquipment.map((eq) => {
        const type = typeMap[eq.type_id];
        // console.log("Type for equipment:", type);
        const iconName = type?.icon ?? "Question";
        const color = type?.color ?? "gray";
        const IconCmp = IconMap[iconName];
        // console.log("Icon component:", IconCmp);
        const leafletIcon = getDivIcon(IconCmp, color);
        // console.log("Leaflet icon:", leafletIcon);
        return (
          <Marker
            key={eq.id}
            position={[eq.lat, eq.lng]}
            icon={leafletIcon}
            eventHandlers={{
              click: () => {
                if (!isMobile) navigate(`/equipment/${eq.id}`);
              },
            }}
          >
            {isMobile ? (
              <Popup autoPan closeButton offset={[5, 0]}>
                <div className="text-sm md:text-lg lg:text-xl p-0 max-w-[80vw] m-0">
                  <h3 className="font-bold">{eq.name}</h3>
                  <p>Type: {type?.displayName ?? "Unknown"}</p>
                  {eq.description && <p>{eq.description}</p>}
                  <button
                    className="mt-2 rounded-xl px-3 py-2 border text-sm font-medium hover:bg-gray-100 active:scale-[.99]"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(`/equipment/${eq.id}`);
                    }}
                  >
                    View details
                  </button>
                </div>
              </Popup>
            ) : (
              <Tooltip
                direction="top"
                offset={[5, -30]}
                opacity={1}
                permanent={false}
              >
                <div className="text-base sm:text-lg lg:text-xl p-3 max-w-[80vw]">
                  <h3 className="font-bold">{eq.name}</h3>
                  <p>Type: {type?.displayName ?? "Unknown"}</p>
                  {eq.description && <p>{eq.description}</p>}
                </div>
              </Tooltip>
            )}
          </Marker>
        );
      })}
    </>
  );
}
