// src/components/Map/SonomaImagery.tsx
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import * as EL from "esri-leaflet";

type Props = { opacity?: number };

export default function SonomaImagery({ opacity = 1 }: Props) {
  const map = useMap();

  useEffect(() => {
    // Use the ImageServer URL from the county site
    const layer = EL.imageMapLayer({
      url: "https://socogis.sonomacounty.ca.gov/image/rest/services/Rasters/Ortho_SoCo_Pictometry_2021/ImageServer",
      attribution: "Imagery © Sonoma County",
      opacity,
    });

    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, opacity]);

  return null;
}
