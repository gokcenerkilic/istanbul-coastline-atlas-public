
import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import { Globe, Users, Camera, Edit3, MapPin, Volume2, Languages } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import MapControls from "../components/atlas/MapControls";
import ContributionPanel from "../components/atlas/ContributionPanel";
import DrawingTools from "../components/atlas/DrawingTools";
import DrawingCanvas from "../components/atlas/DrawingCanvas"; // New import
import LayerControlPanel from "../components/atlas/LayerControlPanel";
import MediaPlayer from "../components/atlas/MediaPlayer";
import LanguageToggle from "../components/atlas/LanguageToggle";
import ContributionMarkers from "../components/atlas/ContributionMarkers";
import DrawingLayer from "../components/atlas/DrawingLayer";
import WorkshopMediaMarkers from "../components/atlas/WorkshopMediaMarkers";
import LocationPicker from "../components/atlas/LocationPicker";
import AdminUploadPanel from "../components/atlas/AdminUploadPanel";
import EnhancedMediaPlayer from "../components/atlas/EnhancedMediaPlayer";
import SearchPanel from "../components/atlas/SearchPanel";
import UIScaleControl from "../components/atlas/UIScaleControl";
import InteractiveMapLayers from "../components/atlas/InteractiveMapLayers";
import TextBoxPanel from "../components/atlas/TextBoxPanel";
import TextBoxMarkers from "../components/atlas/TextBoxMarkers";
import TextBoxPicker from "../components/atlas/TextBoxPicker";
import TextBoxToggle from "../components/atlas/TextBoxToggle";
import MapView3D from "../components/atlas/MapView3D";
import MapView2D from "../components/atlas/MapView2D";
import AdminManagementPanel from "../components/atlas/AdminManagementPanel";
import { Drawing, TextBox, generateSequentialId, User } from "../api/entities";

// --- Mapbox Configuration (no secrets here; token comes from env) ---
const MAPBOX_USERNAME = "gokcenerkilic";
const MAPBOX_STYLE_ID = "cm7et6tk1003o01qpfltz19qs";
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
// -------------------------------------------------------------------

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function Atlas() {
  const [language, setLanguage] = useState('tr');
  const [activePanel, setActivePanel] = useState(null);
  const [activeLayer, setActiveLayer] = useState('custom_atlas'); // 'satellite' or 'custom_atlas'
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isLocationMode, setIsLocationMode] = useState(false);
  const [contributionCoords, setContributionCoords] = useState(null);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [currentDrawings, setCurrentDrawings] = useState([]); // New state for interactive drawings
  const [drawnPaths, setDrawnPaths] = useState([]); // Paths drawn on map, not yet saved
  const [savedDrawings, setSavedDrawings] = useState([]); // Saved drawings (shown as pins)
  const [selectedDrawing, setSelectedDrawing] = useState(null); // Currently selected drawing to display
  const [mapCenter, setMapCenter] = useState([41.0, 29.0]); // Updated center
  const [mapZoom, setMapZoom] = useState(10); // Updated zoom
  const [searchResults, setSearchResults] = useState(null);
  const [uiScale, setUiScale] = useState(1.0);
  const [isTextBoxMode, setIsTextBoxMode] = useState(false);
  const [textBoxes, setTextBoxes] = useState([]);
  const [textBoxCoords, setTextBoxCoords] = useState(null);
  const [showTextBoxes, setShowTextBoxes] = useState(true);
  const [is3DView, setIs3DView] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  const translations = {
    tr: {
      title: "İstanbul Kıyı Çizgisi Atlası",
      subtitle: "Su ve kıyı çizgilerinin katılımcı haritası",
      contribute: "Katkıda Bulun",
      draw: "Çizim Yap",
      media: "Medya",
      layers: "Katmanlar",
      about: "Hakkında",
      textBox: "Metin Kutusu",
      showTextBoxes: "Metin Kutularını Göster",
      hideTextBoxes: "Metin Kutularını Gizle",
      textBoxCount: "metin kutusu"
    },
    en: {
      title: "Istanbul Coastline Atlas",
      subtitle: "Interactive map and participatory archive of water in Istanbul",
      contribute: "Contribute",
      draw: "Draw",
      media: "Media",
      layers: "Layers",
      about: "About",
      textBox: "Text Box",
      showTextBoxes: "Show Text Boxes",
      hideTextBoxes: "Hide Text Boxes",
      textBoxCount: "text boxes"
    }
  };

  const t = translations[language];

  // Fetch textboxes from Base44 on mount
  useEffect(() => {
    const fetchTextBoxes = async () => {
      try {
        console.log('📦 Fetching textboxes from Base44...');
        const result = await TextBox.list();
        console.log('✅ Textboxes fetched:', result);
        setTextBoxes(result || []);
      } catch (error) {
        console.error('❌ Error fetching textboxes:', error);
        setTextBoxes([]);
      }
    };
    
    fetchTextBoxes();
  }, []);

  // Fetch saved drawings from Base44 on mount
  useEffect(() => {
    const fetchDrawings = async () => {
      try {
        console.log('🎨 Fetching drawings from Base44...');
        const result = await Drawing.list();
        console.log('✅ Drawings fetched:', result.length, 'drawings');
        console.log('📊 Raw data from Base44:', result);
        
        // Transform drawings to match the expected format
        const formattedDrawings = result.map((drawing, index) => {
          console.log(`🔍 Drawing ${index + 1}:`, {
            _id: drawing._id,
            drawingId: drawing.drawingId,
            title: drawing.title,
            description: drawing.description,
            category: drawing.category,
            coordinatesCount: drawing.coordinates?.length
          });
          
          // Calculate center point for pin location if needed
          const lats = drawing.coordinates.map(c => c[0]);
          const lngs = drawing.coordinates.map(c => c[1]);
          const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
          const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;
          
          const formatted = {
            id: drawing._id || drawing.drawingId,
            drawingId: drawing.drawingId,
            title: drawing.title,
            description: drawing.description,
            contributor_name: drawing.contributor_name,
            coordinates: drawing.coordinates,
            style: drawing.style || { color: '#ff6b6b', weight: 3, opacity: 0.8 },
            pinLocation: { lat: centerLat, lng: centerLng },
            bounds: drawing.bounds,
            length_meters: drawing.length_meters,
            category: drawing.category,
            created_date: drawing.created_date
          };
          
          console.log(`✅ Formatted drawing ${index + 1}:`, {
            id: formatted.id,
            title: formatted.title,
            category: formatted.category
          });
          
          return formatted;
        });
        
        console.log('📦 Final savedDrawings array:', formattedDrawings.map(d => ({
          id: d.id,
          title: d.title,
          category: d.category
        })));
        
        setSavedDrawings(formattedDrawings);
      } catch (error) {
        console.error('❌ Error fetching drawings:', error);
        setSavedDrawings([]);
      }
    };
    
    fetchDrawings();
  }, []);

  const handleLocationSelect = useCallback((coords) => {
    setContributionCoords(coords);
    setIsLocationMode(false);
  }, []);
  
  const handleContributionPanelOpen = () => {
    setActivePanel('contribute');
    setContributionCoords(null); // Reset coords when panel opens
  };

  const handleContributionPanelClose = () => {
    setActivePanel(null);
  };

  // Handler for when a path is drawn on the map (NOT saving yet)
  const handlePathDrawn = useCallback((pathCoordinates) => {
    console.log('✏️ Path drawn on map:', pathCoordinates);
    // Store the path so DrawingTools can access it
    setDrawnPaths(prev => [...prev, pathCoordinates]);
    // Stop drawing mode so user can fill the form
    setIsDrawingMode(false);
  }, []);

  // Handler for Stop Drawing button - finishes current drawing
  const handleStopDrawing = useCallback(() => {
    console.log('🛑 Stop Drawing triggered from button');
    // Trigger the map to finish the current drawing
    // This will be handled by MapView2D
    setIsDrawingMode(false);
  }, []);

  // Handler for deleting a drawing
  const handleDeleteDrawing = useCallback(async (drawingId) => {
    try {
      console.log('🗑️ Deleting drawing:', drawingId);
      
      // Remove from local state
      setSavedDrawings(prev => prev.filter(d => d.id !== drawingId));
      setSelectedDrawing(null);
      
      // TODO: Delete from database when ready
      // await Drawing.delete(drawingId);
      
      alert(language === 'tr' ? 'Çizim silindi!' : 'Drawing deleted!');
    } catch (error) {
      console.error('❌ Error deleting drawing:', error);
      alert(`Error deleting drawing: ${error.message}`);
    }
  }, [language]); 

  const handleDrawingComplete = useCallback(async (drawingData, pathCoordinates) => {
    console.log('🎨 Drawing save requested:', { drawingData, pathCoordinates });
    
    // Validation is handled in DrawingTools component before calling this
    // No need to validate again here
    
    try {
      // Validate pathCoordinates exists and is an array
      if (!pathCoordinates || !Array.isArray(pathCoordinates) || pathCoordinates.length === 0) {
        console.error('❌ Invalid pathCoordinates:', pathCoordinates);
        alert(language === 'tr' ? 'Çizim verileri geçersiz' : 'Invalid drawing data');
        return;
      }
      
      // Generate sequential ID for the drawing
      const drawingId = await generateSequentialId(Drawing, 'DRW');
      
      console.log('📍 Processing coordinates:', pathCoordinates);
      
      // Convert coordinates to array format [lat, lng] for Base44
      // Base44 expects coordinates as arrays, not objects
      const coordinates = pathCoordinates.map(coord => {
        if (Array.isArray(coord)) {
          // Already in [lat, lng] format
          return coord;
        } else if (coord.lat !== undefined && coord.lng !== undefined) {
          // Convert {lat, lng} to [lat, lng]
          return [coord.lat, coord.lng];
        } else {
          console.error('❌ Unknown coordinate format:', coord);
          throw new Error('Invalid coordinate format');
        }
      });
      
      console.log('✅ Converted coordinates:', coordinates);
      
      // Calculate bounds (extract lat/lng from arrays)
      const lats = coordinates.map(c => c[0]);
      const lngs = coordinates.map(c => c[1]);
      const bounds = {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lngs),
        west: Math.min(...lngs)
      };
      
      // Calculate approximate length in meters (simple Haversine)
      let length_meters = 0;
      for (let i = 0; i < coordinates.length - 1; i++) {
        const R = 6371000; // Earth radius in meters
        const lat1 = coordinates[i].lat * Math.PI / 180;
        const lat2 = coordinates[i + 1].lat * Math.PI / 180;
        const deltaLat = (coordinates[i + 1].lat - coordinates[i].lat) * Math.PI / 180;
        const deltaLng = (coordinates[i + 1].lng - coordinates[i].lng) * Math.PI / 180;
        
        const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                  Math.cos(lat1) * Math.cos(lat2) *
                  Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        length_meters += R * c;
      }
      
      // Save drawing to database
      const savedDrawing = await Drawing.create({
        drawingId,
        title: drawingData.name,
        description: drawingData.description || '',
        contributor_name: drawingData.contributor_name,
        category: drawingData.category || 'other',
        coordinates: coordinates,
        style: drawingData.style || {
          color: '#ff6b6b',
          weight: 3,
          opacity: 0.8
        },
        bounds: bounds,
        length_meters: Math.round(length_meters),
        status: 'pending',
        rejection_reason: '',
        created_date: new Date(),
        approved_date: null,
        approved_by: null,
        language: language
      });
      
      console.log(`✅ Drawing saved with ID: ${drawingId}`, savedDrawing);
      
      // Calculate center point for pin marker
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;
      
      // Add to saved drawings with pin location
      setSavedDrawings(prev => [...prev, {
        id: savedDrawing._id || drawingId,
        drawingId,
        title: drawingData.name,
        description: drawingData.description,
        contributor_name: drawingData.contributor_name,
        coordinates: coordinates,
        style: drawingData.style,
        pinLocation: { lat: centerLat, lng: centerLng },
        bounds: bounds,
        length_meters: Math.round(length_meters)
      }]);
      
      // Clear the drawn paths (remove from map)
      setDrawnPaths([]);
      
      alert(language === 'tr' ? 'Çizim başarıyla kaydedildi!' : 'Drawing saved successfully!');
      
      setIsDrawingMode(false);
      setActivePanel(null);
    } catch (error) {
      console.error('❌ Error saving drawing:', error);
      alert(`Error saving drawing: ${error.message}. Please try again.`);
    }
  }, [language]);

  const handleClearDrawings = useCallback(() => {
    setCurrentDrawings([]); // Clear all drawings from state
  }, []);

  // Prevent closing drawing panel while in drawing mode
  const handleDrawingToolsClose = () => {
    if (isDrawingMode) {
      setIsDrawingMode(false);
    }
    // Keep panel open if there are unsaved drawings
    setActivePanel(null);
  };

  const handleSearchResultClick = (result) => {
    // Pan map to search result location
    setMapCenter([result.lat, result.lng]);
    setMapZoom(16);
    
    // Close search panel and show result
    setActivePanel(null);
    if (result.data.type === 'media') {
      setSelectedMedia(result.data);
    }
  };

  const handleTextBoxLocationSelect = useCallback((coords) => {
    setTextBoxCoords(coords);
  }, []);

  const handleSaveTextBox = useCallback((textBox) => {
    setTextBoxes(prev => {
      const updatedTextBoxes = [...prev, textBox];
      // Store in localStorage for persistence
      localStorage.setItem('atlasTextBoxes', JSON.stringify(updatedTextBoxes));
      return updatedTextBoxes;
    });
    setTextBoxCoords(null);
    setIsTextBoxMode(false);
    setActivePanel(null);
  }, []);

  const handleTextBoxClick = useCallback((textBox) => {
    // Pan to text box location
    setMapCenter([textBox.coords.lat, textBox.coords.lng]);
    setMapZoom(15);
  }, []);

  const handleDeleteTextBox = useCallback((textBoxId) => {
    setTextBoxes(prev => {
      const updatedTextBoxes = prev.filter(tb => tb.id !== textBoxId);
      // Update localStorage
      localStorage.setItem('atlasTextBoxes', JSON.stringify(updatedTextBoxes));
      return updatedTextBoxes;
    });
  }, []);

  // Load text boxes from localStorage on mount
  useEffect(() => {
    const savedTextBoxes = localStorage.getItem('atlasTextBoxes');
    if (savedTextBoxes) {
      try {
        setTextBoxes(JSON.parse(savedTextBoxes));
      } catch (error) {
        console.error('Error loading text boxes:', error);
      }
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/60 to-transparent">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="text-white">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="w-8 h-8 text-blue-400" />
                <h1 className="text-2xl md:text-3xl font-bold">{t.title}</h1>
              </div>
              <p className="text-gray-200 text-sm md:text-base max-w-md">
                {t.subtitle}
              </p>
            </div>
            <LanguageToggle language={language} setLanguage={setLanguage} />
          </div>
        </div>
      </div>

      {/* Map Container - Conditional Rendering for 2D/3D */}
      {!is3DView ? (
        <MapView2D 
          center={mapCenter}
          zoom={mapZoom}
          activeLayer={activeLayer}
          language={language}
          textBoxes={textBoxes}
          showTextBoxes={showTextBoxes}
          onTextBoxClick={handleTextBoxClick}
          onDeleteTextBox={handleDeleteTextBox}
          isDrawingMode={isDrawingMode}
          onDrawingComplete={handlePathDrawn}
          isLocationMode={isLocationMode}
          onLocationSelect={(coords) => setContributionCoords(coords)}
          isTextBoxMode={isTextBoxMode}
          onTextBoxLocationSelect={handleTextBoxLocationSelect}
          textBoxCoords={textBoxCoords}
          drawnPaths={drawnPaths}
          savedDrawings={savedDrawings}
          selectedDrawing={selectedDrawing}
          onDrawingPinClick={(drawing) => {
            console.log('👆 Drawing selected in Atlas:', drawing);
            setSelectedDrawing(drawing);
          }}
          onDeleteDrawing={handleDeleteDrawing}
        />
      ) : (
        <MapView3D 
          center={mapCenter}
          zoom={mapZoom}
          activeLayer={activeLayer}
          language={language}
          textBoxes={textBoxes}
          showTextBoxes={showTextBoxes}
          onTextBoxClick={handleTextBoxClick}
          onDeleteTextBox={handleDeleteTextBox}
          onMediaClick={setSelectedMedia}
        />
      )}

      {/* Map Controls */}
      <MapControls 
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        onContributeClick={handleContributionPanelOpen}
        isDrawingMode={isDrawingMode}
        setIsDrawingMode={setIsDrawingMode}
        language={language}
        is3DView={is3DView}
        setIs3DView={setIs3DView}
        onAdminClick={() => setShowAdminPanel(true)}
      />

      {/* Side Panels */}
      <ContributionPanel 
        isOpen={activePanel === 'contribute'}
        onClose={handleContributionPanelClose}
        language={language}
        isLocationMode={isLocationMode}
        setIsLocationMode={setIsLocationMode}
        coords={contributionCoords}
        scale={uiScale}
      />
      
      <LayerControlPanel
        isOpen={activePanel === 'layers'}
        onClose={() => setActivePanel(null)}
        language={language}
        activeLayer={activeLayer}
        setActiveLayer={setActiveLayer}
        scale={uiScale}
      />

      <DrawingTools 
        isOpen={activePanel === 'draw'}
        onClose={handleDrawingToolsClose}
        isDrawingMode={isDrawingMode}
        setIsDrawingMode={setIsDrawingMode}
        language={language}
        onDrawingComplete={handleDrawingComplete} // Pass the handler for Save button
        onClearDrawings={() => { handleClearDrawings(); setDrawnPaths([]); }} // Clear both
        drawnPaths={drawnPaths} // Pass paths drawn on map
        onStopDrawing={handleStopDrawing} // Pass stop drawing handler
        scale={uiScale}
      />

      <AdminUploadPanel
        isOpen={activePanel === 'upload'}
        onClose={() => setActivePanel(null)}
        language={language}
        scale={uiScale}
      />

      <SearchPanel
        isOpen={activePanel === 'search'}
        onClose={() => setActivePanel(null)}
        language={language}
        onResultClick={handleSearchResultClick}
        scale={uiScale}
      />

      <TextBoxPanel
        isOpen={activePanel === 'textbox'}
        onClose={() => {
          setActivePanel(null);
          setIsTextBoxMode(false);
          setTextBoxCoords(null);
        }}
        language={language}
        isLocationMode={isTextBoxMode}
        setIsLocationMode={setIsTextBoxMode}
        coords={textBoxCoords}
        onSaveTextBox={handleSaveTextBox}
        scale={uiScale}
      />

      {/* Enhanced Media Player Modal */}
      {selectedMedia && (
        <EnhancedMediaPlayer 
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          language={language}
          scale={uiScale}
        />
      )}

      {/* Footer Info */}
      <div className="absolute bottom-[22px] left-4 z-50 bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white text-xs">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{language === 'tr' ? 'Topluluk destekli proje' : 'Community-supported project'}</span>
        </div>
      </div>
      
      {/* Text Box Toggle Control */}
      {textBoxes.length > 0 && (
        <TextBoxToggle
          showTextBoxes={showTextBoxes}
          setShowTextBoxes={setShowTextBoxes}
          textBoxCount={textBoxes.length}
          language={language}
        />
      )}
      
      <UIScaleControl scale={uiScale} setScale={setUiScale} language={language} />
      
      {/* Admin Management Panel */}
      {showAdminPanel && (
        <AdminManagementPanel
          language={language}
          onClose={() => setShowAdminPanel(false)}
        />
      )}
    </div>
  );
}
