// EquipmentLayer.tsx (key parts)
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClusteredEquipmentLayer from "./ClusteredEquipmentLayer"; // the small wrapper around leaflet.markercluster
import { supabase } from "../../supabaseClient";
import type { Database } from "../../types/supabase";
import L from "leaflet";
import { IconMap } from "../../data/icons";
import ReactDOMServer from "react-dom/server";

type Equipment = Database["public"]["Tables"]["equipment"]["Row"];

interface Props {
  // from App -> FilterPanel
  filters: number[]; // list of selected type_ids
  search: string;    // debounced SearchBar value
  typeMap: Record<number, { displayName: string; icon: string; color: string }>;
}

export default function EquipmentLayer({ filters, search, typeMap }: Props) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const navigate = useNavigate();
  const iconCache = useRef(new Map<string, L.DivIcon>());

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
    (async () => {
      const { data, error } = await supabase.from("equipment").select("*");
      if (!error && data) setEquipment(data as Equipment[]);
    })();
  }, []);

  // 1) Apply your filters BEFORE clustering
  const term = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    return equipment
      // type filter: if none selected, show all
      .filter((e) => !filters.length || (e.type_id != null && filters.includes(e.type_id)))
      // name filter: startsWith is what you’re using today
      .filter((e) => (term ? (e.name ?? "").toLowerCase().startsWith(term) : true));
  }, [equipment, filters, term]);

  function getIcon(eq: Equipment) {
    const type = eq.type_id != null ? typeMap[eq.type_id] : undefined;
    const iconName = type?.icon ?? "Question";
    const color = type?.color ?? "gray";
    const key = `${iconName}:${color}:30`;

    const cached = iconCache.current.get(key);
    if (cached) return cached;

    const Svg = IconMap[iconName];
    const html = ReactDOMServer.renderToStaticMarkup(
      <Svg style={{ color, width: 30, height: 30 }} />
    );
    const divIcon = L.divIcon({
      className: "custom-marker",
      html: `<div class="marker-inner">${html}</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -15],
    });
    iconCache.current.set(key, divIcon);
    return divIcon;
  }

  return (
    <ClusteredEquipmentLayer
      equipment={filtered}
      getIcon={getIcon}
      onClick={(eq) => navigate(`/equipment/${eq.id}`)}
      isMobile ={isMobile}
    />
  );
}

