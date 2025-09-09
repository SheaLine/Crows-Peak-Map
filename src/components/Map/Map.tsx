import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import ranchBoundary from "../../data/MapScrollBoundary.json";
import * as turf from "@turf/turf";
import type { FeatureCollection, Polygon } from "geojson";

interface MapProps {
  children?: React.ReactNode;
}

const bbox = turf.bbox(ranchBoundary as FeatureCollection<Polygon>);
const center: LatLngExpression = [
  (bbox[1] + bbox[3]) / 2,
  (bbox[0] + bbox[2]) / 2,
];

const maxBounds: [[number, number], [number, number]] = [
  [bbox[1], bbox[0]],
  [bbox[3], bbox[2]],
];

function map({ children }: MapProps) {
  return (
    <MapContainer
      center={center}
      zoom={17}
      maxBounds={maxBounds}
      maxBoundsViscosity={1.0}
      minZoom={16}
      className="flex-1"
    >
      <TileLayer
        url={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${
          import.meta.env.VITE_MAPBOX_TOKEN
        }`}
        tileSize={512}
        zoomOffset={-1}
        maxZoom={22}
      />
        {children}
    </MapContainer>
  );
}

export default map;
