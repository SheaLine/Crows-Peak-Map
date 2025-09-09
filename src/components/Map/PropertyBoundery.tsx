import { GeoJSON } from "react-leaflet";
import property from "../../data/propertyLine.json";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { Layer } from "leaflet";

export default function PropertyBoundaries() {
  const onEachFeature = (feature: Feature<Geometry, { APN?: string }>, layer: Layer) => {
    if (feature.properties?.APN) {
      layer.bindTooltip(
        `Property line for APN: ${feature.properties.APN}`,
        { permanent: false, sticky: true, direction: "top" }
      );
    }
    
  };

  return (
    <GeoJSON
      data={property as FeatureCollection}
      style={() => ({
        color: "white",
        weight: 6,
        dashArray: "16 32",
        opacity: 1,
      })}
      onEachFeature={onEachFeature}
    />
  );
}
