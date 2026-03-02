import { useMapEvents } from "react-leaflet";

export default function TextBoxPicker({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect({ lat, lng });
    }
  });

  return null;
}
