// src/components/Map/ClusteredEquipmentLayer.tsx
import { useEffect, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster"; // side-effect import
import type { Database } from "../../types/supabase";
import { IconMap } from "../../data/icons";
import ReactDOMServer from "react-dom/server";

export type Eq = Database["public"]["Tables"]["equipment"]["Row"];

type Props = {
  equipment: Eq[];
  getIcon: (e: Eq) => L.DivIcon; // your existing icon factory
  onClick?: (e: Eq) => void; // navigate to details, etc.
  isMobile: boolean;
};

type IconKey = keyof typeof IconMap;
function makeClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();

  // pick an icon from your IconMap (you can also compute this per-cluster)
  const key = String(count) as IconKey;
  const Icon = IconMap[key];

  // render react-icon to an inline SVG string
  const svg = ReactDOMServer.renderToString(<Icon size={36} />);
  const size = 46;

  const haloBg = "rgba(0,0,0,0.25)"; // lighter, translucent
  const ringBg = "rgba(0,0,0,0.6)"; // medium
  const coreBg = "rgba(0,0,0,1)"; // solid

  const halo = 3; // thickness of the soft outer ring
  const ring = 3; // thickness of the middle ring
  const core = size - halo * 2 - ring * 2; // inner dot size

  // build HTML for the DivIcon (Tailwind works if your app CSS is loaded)
  const html = `
    <div class="relative grid place-items-center rounded-full"
       style="width:${size}px;height:${size}px;background:${haloBg};">
    <div class="grid place-items-center rounded-full"
         style="width:${size - halo * 2}px;height:${
    size - halo * 2
  }px;background:${ringBg};
                box-shadow: inset 0 0 0 1px rgba(0,0,0,.06);">
      <div class="grid place-items-center rounded-full"
           style="width:${core}px;height:${core}px;background:${coreBg};
                  box-shadow: 0 1px 2px rgba(0,0,0,.12), inset 0 0 0 1px rgba(0,0,0,.06);">
         <span class="text-white" style="font: 600 12px system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
          ${svg}
        </span>
      </div>
    </div>
  </div>
  `;

  return L.divIcon({
    html,
    className: "cluster-icon",
    iconSize: [size, size],
  });
}

export default function ClusteredEquipmentLayer({
  equipment,
  getIcon,
  onClick,
  isMobile = false,
}: Props) {
  const map = useMap();

  // memoize markers data so we only rebuild when input actually changes
  const items = useMemo(() => equipment, [equipment]);

  useEffect(() => {
    // 1) create cluster group
    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 0,
      spiderLegPolylineOptions: { weight: 5, opacity: 1, color: "black" },
      iconCreateFunction: makeClusterIcon,
    });

    // 2) add markers
    const leafletMarkers: L.Marker[] = items.map((eq) => {
      const m = L.marker([eq.lat, eq.lng], { icon: getIcon(eq) });

      if (isMobile) {
        // Build a DOM node for the popup content (no querySelector later)
        const content = L.DomUtil.create("div");
        content.className = "text-sm p-0 max-w-[80vw] m-0";
        content.innerHTML = `
    <h3 class="font-bold">${eq.name ?? ""}</h3>
    ${eq.description ? `<p>${eq.description}</p>` : ""}
    <button
      class="mt-2 rounded-xl px-3 py-2 border text-sm font-medium hover:bg-gray-100 active:scale-[.99]"
    >View details</button>
  `;

        // Prevent taps/clicks inside the popup from bubbling to the map/cluster
        L.DomEvent.disableClickPropagation(content);
        L.DomEvent.disableScrollPropagation(content);

        // Hook the button BEFORE the popup opens
        const btn = content.querySelector<HTMLButtonElement>("button");
        if (btn) {
          const handler = (e: Event) => {
            L.DomEvent.stop(e); // preventDefault + stopPropagation (mobile-safe)
            onClick?.(eq); // parent navigates to /equipment/:id
            // map.closePopup();   // optional
          };
          // Use Leaflet's DomEvent to normalize touch/pointer/click
          L.DomEvent.on(btn, "click", handler);
          L.DomEvent.on(btn, "touchend", handler);
          L.DomEvent.on(btn, "pointerup", handler);
        }

        // Bind the DOM node as content (no string/HTML parsing later)
        m.bindPopup(content, {
          autoPan: true,
          closeButton: true,
          offset: L.point(5, 0),
          closeOnClick: false,
          autoClose: false,
        });

        // Open popup on tap
        m.on("click", () => m.openPopup());
      } else {
        m.bindTooltip(
          `<div class="text-sm font-semibold">${eq.name}</div>${
            eq.description
              ? `<div class="text-xs mt-1">${eq.description}</div>`
              : ""
          }`,
          { direction: "top", offset: L.point(5, -36), permanent: false }
        );
        m.on("click", () => onClick?.(eq));
      }

      return m;
    });

    cluster.addLayers(leafletMarkers);
    cluster.addTo(map);

    // 3) cleanup on unmount or when data changes
    return () => {
      cluster.clearLayers();
      map.removeLayer(cluster);
    };
  }, [map, items, getIcon, onClick, isMobile]);

  return null; // this layer is purely imperative
}
