import React, { useEffect, useState } from "react";
import { Polyline, Tooltip } from "react-leaflet";
import { supabase } from "../../supabaseClient";
import type { Database } from "../../types/supabase";

// The database for lines has a "coordinates" field stored as jsonb
// which contains an array of [lng, lat] pairs (GeoJSON format).
// We need to override the type to reflect this.
type LineRaw = Database["public"]["Tables"]["lines"]["Row"];
export interface Line extends Omit<LineRaw, "coordinates"> {
  coordinates: number[][]; // override jsonb → number[][]
}

interface LineLayerProps {
  filters: number[];
  typeMap: Record<number, { displayName: string; icon: string; color: string }>;
  search: string
}

export default function LineLayer({ filters, typeMap, search }: LineLayerProps) {
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    const fetchLines = async () => {
      const { data, error } = await supabase.from("lines").select("*");
      if (error) {
        console.error("Error fetching lines:", error.message);
      } else {
        setLines((data || []) as Line[]);
      }
    };
    fetchLines();
  }, []);

  const term = search.trim().toLowerCase()

  const filteredLines = lines
    .filter((eq) => filters.length ? filters.includes(eq.type_id) : lines)
    .filter((eq) => term ? (eq.name ?? "").toLowerCase().startsWith(term): lines)

  return (
    <>
      {filteredLines.map((line) => (
        <React.Fragment key={line.id}>
          <Polyline
            positions={line.coordinates.map(([lng, lat]) => [lat, lng])}
            pathOptions={{
              color: "transparent", // invisible
              weight: 15,
            }}
            interactive={true}
          >
            <Tooltip sticky>
              <div className="text-base sm:text-lg lg:text-xl p-3 max-w-[80vw]">
                <h3 className="font-bold">{line.name}</h3>
                <p>Type: {typeMap[line.type_id]?.displayName}</p>
                {line.description && <p>{line.description}</p>}
              </div>
            </Tooltip>
          </Polyline>
          <Polyline
            positions={
              line.coordinates
                ? line.coordinates.map(([lng, lat]) => [lat, lng])
                : []
            } // GeoJSON is [lng, lat], Leaflet expects [lat, lng]
            pathOptions={{ color: typeMap[line.type_id]?.color, weight: 4 }}
          ></Polyline>
        </React.Fragment>
      ))}
    </>
  );
}
