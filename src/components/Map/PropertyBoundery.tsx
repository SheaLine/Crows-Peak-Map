import { GeoJSON } from "react-leaflet";
import property from "../../data/propertyLine.json";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { Layer } from "leaflet";

export default function PropertyBoundaries() {

  const BORDER_COLORS: Record<string, string> = {
  "Creek": "#8A2BE2",            // BlueViolet
  "Tim's 100 Acres": "#00CED1",       // DarkTurquoise
  "Tim's 50 Acres": "#FF1493",          // DeepPink
  "5000 Caz HWY": "#FF8C00", // DarkOrange
};

  const onEachFeature = (feature: Feature<Geometry, { PARCEL: string }>, layer: Layer) => {
    const name = feature.properties.PARCEL
    if (name) {
      layer.bindTooltip(
        `Property line for: <strong>${name}`,
        { permanent: false, sticky: true, direction: "top" }
      );
    }    
  };

  const getColor = (feature?: Feature<Geometry, { PARCEL: string }>) => {
  const name = feature?.properties?.PARCEL?.trim() ?? "";
  return BORDER_COLORS[name] ?? "grey";
};

  return (
    <GeoJSON
      data={property as FeatureCollection}
      style={(feature) => ({
        color: getColor(feature as Feature<Geometry, { PARCEL: string }>),
        weight: 6,
        dashArray: "16 32",
        opacity: 1,
      })}
      onEachFeature={onEachFeature}
    />
  );
}
