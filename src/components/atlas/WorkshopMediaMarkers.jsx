import React, { useState, useEffect } from "react";
import { Marker } from "react-leaflet";
import { WorkshopMedia } from "@/api/entities";
import L from "leaflet";

// Custom marker icons for different media types
const audioIcon = L.divIcon({
  html: `<div style="background-color: #8b5cf6; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
    <span style="color: white; font-size: 8px;">♪</span>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  className: 'custom-media-marker'
});

const imageIcon = L.divIcon({
  html: `<div style="background-color: #f59e0b; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
    <span style="color: white; font-size: 8px;">📷</span>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  className: 'custom-media-marker'
});

export default function WorkshopMediaMarkers({ language, onMediaClick }) {
  const [mediaItems, setMediaItems] = useState([]);

  useEffect(() => {
    loadWorkshopMedia();
  }, []);

  const loadWorkshopMedia = async () => {
    try {
      const data = await WorkshopMedia.list('-created_date');
      setMediaItems(data.filter(item => item.latitude && item.longitude));
    } catch (error) {
      console.error('Error loading workshop media:', error);
    }
  };

  const getMarkerIcon = (mediaType) => {
    switch (mediaType) {
      case 'audio':
        return audioIcon;
      case 'image':
        return imageIcon;
      default:
        return imageIcon;
    }
  };

  return (
    <>
      {mediaItems.map((media) => (
        <Marker
          key={media.id}
          position={[media.latitude, media.longitude]}
          icon={getMarkerIcon(media.media_type)}
          eventHandlers={{
            click: () => onMediaClick(media)
          }}
        />
      ))}
    </>
  );
}