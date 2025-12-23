import { GeoJSON } from "react-leaflet";
import buildings from "../../data/buildings.json";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { Layer } from "leaflet";

export default function BuildingsLayer() {
  const onEachFeature = (
    feature: Feature<Geometry, { name: string }>,
    layer: Layer
  ) => {
    const name = feature.properties.name;
    if (name) {
      layer.bindTooltip(`<div class="text-sm font-semibold">${name}</div>`, {
        permanent: false,
        sticky: true,
        direction: "top",
      });
    }
  };
  return (
    <GeoJSON
      data={buildings as FeatureCollection}
      style={() => ({
        color: "#02F901",
        weight: 2,
        opacity: 0.6,
        fillOpacity: 0.1,
      })}
      onEachFeature={onEachFeature}
    />
  );
}
