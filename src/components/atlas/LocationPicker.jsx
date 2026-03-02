import React from 'react';
import { useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Custom cursor icon
const crosshairIcon = L.divIcon({
  html: `<div style="width: 24px; height: 24px; border: 2px solid #3b82f6; border-radius: 50%; background-color: rgba(59, 130, 246, 0.2); box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`,
  className: 'leaflet-crosshair-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function LocationPicker({ onLocationSelect }) {
  const map = useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
    mousemove(e) {
      // This could be used for a temporary marker that follows the mouse
    },
  });

  // Change cursor style when this component is active
  React.useEffect(() => {
    map.getContainer().style.cursor = 'crosshair';
    
    return () => {
      map.getContainer().style.cursor = '';
    };
  }, [map]);

  return null;
}