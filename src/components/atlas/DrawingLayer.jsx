import React, { useState, useEffect } from "react";
import { Polyline, Popup, Tooltip } from "react-leaflet";
import { Drawing } from "@/api/entities";

export default function DrawingLayer({ language }) {
  const [drawings, setDrawings] = useState([]);

  useEffect(() => {
    loadDrawings();
  }, []);

  const loadDrawings = async () => {
    try {
      const data = await Drawing.filter({ status: 'approved' });
      const validDrawings = data.filter(drawing => drawing.coordinates && drawing.coordinates.length > 0);
      console.log('🎨 Loaded drawings for 2D view:', validDrawings.length, validDrawings);
      setDrawings(validDrawings);
    } catch (error) {
      console.error('Error loading drawings:', error);
    }
  };

  const translations = {
    tr: {
      clickToPin: 'Sabitlemek için tıklayın',
      contributedBy: 'Katkıda bulunan',
      drawing: 'Çizim'
    },
    en: {
      clickToPin: 'Click to pin this popup',
      contributedBy: 'Contributed by',
      drawing: 'Drawing'
    }
  };

  const t = translations[language] || translations.en;

  return (
    <>
      {drawings.map((drawing) => (
        <Polyline
          key={drawing.id}
          positions={drawing.coordinates}
          pathOptions={{
            color: drawing.style?.color || '#ff6b6b',
            weight: drawing.style?.weight || 3,
            opacity: drawing.style?.opacity || 0.8
          }}
          eventHandlers={{
            mouseover: (e) => {
              e.target.setStyle({
                color: '#ff0000',
                weight: 5
              });
            },
            mouseout: (e) => {
              e.target.setStyle({
                color: drawing.style?.color || '#ff6b6b',
                weight: drawing.style?.weight || 3
              });
            }
          }}
        >
          {/* Tooltip for hover */}
          <Tooltip permanent={false} sticky={true}>
            <div style={{ minWidth: '150px' }}>
              <strong>{drawing.title || t.drawing}</strong>
              {drawing.description && (
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  {drawing.description.substring(0, 50)}
                  {drawing.description.length > 50 ? '...' : ''}
                </div>
              )}
              <div style={{ fontSize: '11px', marginTop: '4px', fontStyle: 'italic', opacity: 0.7 }}>
                {t.clickToPin}
              </div>
            </div>
          </Tooltip>
          
          {/* Popup for click */}
          <Popup>
            <div className="p-2 min-w-[200px]">
              <h3 className="font-bold text-base text-gray-900 mb-1">
                {drawing.title || t.drawing}
              </h3>
              {drawing.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {drawing.description}
                </p>
              )}
              {drawing.contributor_name && (
                <p className="text-xs text-gray-500 mt-2">
                  {t.contributedBy}: {drawing.contributor_name}
                </p>
              )}
              {drawing.created_date && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(drawing.created_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </Popup>
        </Polyline>
      ))}
    </>
  );
}