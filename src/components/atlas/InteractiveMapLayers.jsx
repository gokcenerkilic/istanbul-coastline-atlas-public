import React, { useState, useEffect } from 'react';
import { GeoJSON, Popup } from 'react-leaflet';
import L from 'leaflet';

export default function InteractiveMapLayers({ language }) {
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [popupPosition, setPopupPosition] = useState(null);
  const [mapFeatures, setMapFeatures] = useState(null);

  const translations = {
    tr: {
      district: "İlçe",
      neighborhood: "Mahalle",
      coastalArea: "Kıyı Bölgesi",
      waterBody: "Su Kütlesi",
      area: "Alan",
      length: "Uzunluk"
    },
    en: {
      district: "District",
      neighborhood: "Neighborhood", 
      coastalArea: "Coastal Area",
      waterBody: "Water Body",
      area: "Area",
      length: "Length"
    }
  };

  const t = translations[language];

  // Sample GeoJSON data - in a real app, this would come from your data source
  useEffect(() => {
    // This is sample data - replace with actual Istanbul coastline/district data
    const sampleFeatures = {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {
            "name": "Beşiktaş",
            "type": "district",
            "population": 175000,
            "coastline_length": "5.2 km",
            "area": "18 km²"
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[
              [29.0, 41.05],
              [29.02, 41.05],
              [29.02, 41.07],
              [29.0, 41.07],
              [29.0, 41.05]
            ]]
          }
        },
        {
          "type": "Feature", 
          "properties": {
            "name": "Kadıköy",
            "type": "district",
            "population": 467919,
            "coastline_length": "8.7 km",
            "area": "25 km²"
          },
          "geometry": {
            "type": "Polygon",
            "coordinates": [[
              [29.02, 41.02],
              [29.05, 41.02], 
              [29.05, 41.05],
              [29.02, 41.05],
              [29.02, 41.02]
            ]]
          }
        }
      ]
    };
    setMapFeatures(sampleFeatures);
  }, []);

  const getFeatureStyle = (feature) => {
    const isHovered = hoveredFeature && hoveredFeature.properties.name === feature.properties.name;
    
    return {
      fillColor: isHovered ? '#3b82f6' : 'transparent',
      weight: isHovered ? 3 : 1,
      color: isHovered ? '#1d4ed8' : '#6b7280',
      fillOpacity: isHovered ? 0.3 : 0.1,
      dashArray: isHovered ? '' : '5, 5'
    };
  };

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        setHoveredFeature(feature);
        setPopupPosition([e.latlng.lat, e.latlng.lng]);
        layer.setStyle({
          fillColor: '#3b82f6',
          weight: 3,
          color: '#1d4ed8',
          fillOpacity: 0.3,
          dashArray: ''
        });
      },
      mouseout: () => {
        setHoveredFeature(null);
        setPopupPosition(null);
        layer.setStyle({
          fillColor: 'transparent',
          weight: 1,
          color: '#6b7280',
          fillOpacity: 0.1,
          dashArray: '5, 5'
        });
      }
    });
  };

  if (!mapFeatures) return null;

  return (
    <>
      <GeoJSON
        data={mapFeatures}
        style={getFeatureStyle}
        onEachFeature={onEachFeature}
      />
      
      {hoveredFeature && popupPosition && (
        <Popup 
          position={popupPosition}
          closeButton={false}
          autoClose={false}
          closeOnClick={false}
          className="hover-popup"
        >
          <div className="p-2 min-w-48">
            <h3 className="font-bold text-lg mb-2 text-gray-900">
              {hoveredFeature.properties.name}
            </h3>
            <div className="space-y-1 text-sm">
              {hoveredFeature.properties.type && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tip:</span>
                  <span className="font-medium">{t[hoveredFeature.properties.type] || hoveredFeature.properties.type}</span>
                </div>
              )}
              {hoveredFeature.properties.population && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Nüfus:</span>
                  <span className="font-medium">{hoveredFeature.properties.population.toLocaleString()}</span>
                </div>
              )}
              {hoveredFeature.properties.coastline_length && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.length}:</span>
                  <span className="font-medium">{hoveredFeature.properties.coastline_length}</span>
                </div>
              )}
              {hoveredFeature.properties.area && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t.area}:</span>
                  <span className="font-medium">{hoveredFeature.properties.area}</span>
                </div>
              )}
            </div>
          </div>
        </Popup>
      )}
    </>
  );
}