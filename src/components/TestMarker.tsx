import { Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

interface MarkerProps {
  position: LatLngExpression;
  popupContent: string;
}
function TestMarker({ position, popupContent }: MarkerProps) {
  return (
    <Marker position={position}>
      <Popup>
        <div className="text-sm font-medium text-gray-800">{popupContent}</div>
      </Popup>
    </Marker>
  );
}

export default TestMarker;
