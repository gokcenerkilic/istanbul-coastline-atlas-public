import React, { useState, useEffect } from "react";
import { Marker, Popup } from "react-leaflet";
import { Contribution } from "@/api/entities";
import L from "leaflet";

// Custom marker icon for contributions
const contributionIcon = L.divIcon({
  html: '<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: 'custom-marker'
});

export default function ContributionMarkers({ language, onMarkerClick }) {
  const [contributions, setContributions] = useState([]);

  useEffect(() => {
    loadContributions();
  }, [language]);

  const loadContributions = async () => {
    try {
      const data = await Contribution.filter({ status: 'approved' });
      setContributions(data);
    } catch (error) {
      console.error('Error loading contributions:', error);
    }
  };

  const categoryLabels = {
    tr: {
      observation: "Gözlem",
      historical: "Tarihsel",
      environmental: "Çevresel",
      cultural: "Kültürel",
      other: "Diğer"
    },
    en: {
      observation: "Observation",
      historical: "Historical",
      environmental: "Environmental",
      cultural: "Cultural",
      other: "Other"
    }
  };

  return (
    <>
      {contributions.map((contribution) => (
        <Marker
          key={contribution.id}
          position={[contribution.latitude, contribution.longitude]}
          icon={contributionIcon}
        >
          <Popup className="custom-popup">
            <div className="p-3 min-w-64">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                {contribution.title}
              </h3>
              {contribution.description && (
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                  {contribution.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {categoryLabels[language][contribution.category]}
                </span>
                {contribution.contributor_name && (
                  <span>{contribution.contributor_name}</span>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
}