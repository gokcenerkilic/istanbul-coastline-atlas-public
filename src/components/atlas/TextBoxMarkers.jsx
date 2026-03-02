import React, { useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MessageSquare, Trash2 } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

// Create custom icon for text box markers
const createTextBoxIcon = () => {
  const iconMarkup = renderToStaticMarkup(
    <div style={{
      backgroundColor: '#3b82f6',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '3px solid white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    }}>
      <MessageSquare 
        style={{ 
          color: 'white', 
          width: '18px', 
          height: '18px' 
        }} 
      />
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-text-box-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

export default function TextBoxMarkers({ textBoxes, onTextBoxClick, onDeleteTextBox, language }) {
  const textBoxIcon = createTextBoxIcon();

  const translations = {
    tr: {
      delete: "Sil",
      confirmDelete: "Bu metin kutusunu silmek istediğinizden emin misiniz?"
    },
    en: {
      delete: "Delete",
      confirmDelete: "Are you sure you want to delete this text box?"
    }
  };

  const t = translations[language] || translations.en;

  const handleDelete = (e, textBoxId) => {
    e.stopPropagation();
    if (window.confirm(t.confirmDelete)) {
      onDeleteTextBox(textBoxId);
    }
  };

  return (
    <>
      {textBoxes.map((textBox) => (
        <Marker
          key={textBox.id}
          position={[textBox.coords.lat, textBox.coords.lng]}
          icon={textBoxIcon}
          eventHandlers={{
            click: () => {
              if (onTextBoxClick) {
                onTextBoxClick(textBox);
              }
            }
          }}
        >
          <Popup className="custom-popup" minWidth={220}>
            <div className="p-2 min-w-[200px] max-w-[300px]">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900 flex-1">
                  {textBox.title}
                </h3>
                <button
                  onClick={(e) => handleDelete(e, textBox.id)}
                  className="ml-2 p-1.5 rounded-md hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                  title={t.delete}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {textBox.content}
              </p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {new Date(textBox.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}
