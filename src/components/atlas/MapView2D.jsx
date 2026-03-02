import React, { useRef, useEffect, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MessageSquare, X } from 'lucide-react';
import { DrawingOverlay } from '@/utils/DrawingOverlay';
import ADA1Img from '../../../img/ADA1.png';
import DERE1Img from '../../../img/DERE1.png';
import GOL1Img from '../../../img/GOL1.png';
import SES1Img from '../../../img/SES1.png';
import SES2Img from '../../../img/SES2.png';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_USERNAME = "gokcenerkilic";
const MAPBOX_STYLE_ID = "cm7et6tk1003o01qpfltz19qs";

// Layer configuration for hover interactions
const LAYER_CONFIG = {
  R1: { id: 'R1', name: 'R1 District', category: 'Residential', color: '#ff4d4d' },
  D1: { id: 'D1', name: 'Kağıthane Alibeyköy Dere Ağı', category: 'Development', color: '#ff4d4d' },
  D2: { id: 'D2', name: 'D2 District', category: 'Development', color: '#00ffff' },
  A1: { id: 'A1', name: 'ADA', category: 'Administrative', color: '#ff0000' },
  A2: { id: 'A2', name: 'A2 District', category: 'Administrative', color: '#00ffff' },
  G1: { id: 'G1', name: 'Tayakadın Kulakçayırı Gölü ve Taş Ocakları', category: 'Green Zone', color: '#ff4d4d' },
  G2: { id: 'G2', name: 'G2 District', category: 'Green Zone', color: '#ffffff' },
  GCL2: { id: 'GCL2', name: 'GCL2 District', category: 'Green Coastline', color: '#ffffff' },
  T1: { id: 'T1', name: 'T1 District', category: 'Transit', color: '#ffcc00' },
  T2: { id: 'T2', name: 'T2 District', category: 'Transit', color: '#ff9900' }
};

export default function MapView2D({
  center,
  zoom,
  activeLayer,
  language,
  textBoxes = [],
  showTextBoxes,
  onTextBoxClick,
  onDeleteTextBox,
  isDrawingMode,
  onDrawingComplete,
  isLocationMode,
  onLocationSelect,
  isTextBoxMode,
  onTextBoxLocationSelect,
  textBoxCoords,
  drawnPaths = [], // Unsaved drawings to display
  savedDrawings = [], // Saved drawings (shown as pins)
  selectedDrawing = null, // Currently selected drawing to show
  onDrawingPinClick, // Callback when pin is clicked
  onDeleteDrawing // Callback to delete a drawing
}) {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: center[1],
    latitude: center[0],
    zoom: zoom
  });
  const [selectedTextBox, setSelectedTextBox] = useState(null);
  const [hoveredTextBox, setHoveredTextBox] = useState(null);
  const [hoveredDrawing, setHoveredDrawing] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawingOverlayRef = useRef(null);

  // If there is no Mapbox token configured, show a clear in-app message
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error("VITE_MAPBOX_ACCESS_TOKEN is not set. Create a .env file with your Mapbox token.");
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white text-center p-4">
        <div>
          <p className="font-semibold mb-2">Mapbox map is not configured.</p>
          <p className="text-sm opacity-80">
            Set <span className="font-mono">VITE_MAPBOX_ACCESS_TOKEN</span> in a local <span className="font-mono">.env</span> file
            using your Mapbox access token, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  // Debug: Log when selectedDrawing changes
  useEffect(() => {
    console.log('🔄 selectedDrawing prop changed:', selectedDrawing ? {
      id: selectedDrawing.id,
      title: selectedDrawing.title,
      hasCoordinates: !!selectedDrawing.coordinates,
      coordinatesLength: selectedDrawing.coordinates?.length
    } : 'NULL');
  }, [selectedDrawing]);

  // Get the appropriate style URL based on activeLayer
  const getStyleUrl = () => {
    if (activeLayer === 'satellite') {
      return 'mapbox://styles/mapbox/satellite-streets-v12';
    }
    return `mapbox://styles/${MAPBOX_USERNAME}/${MAPBOX_STYLE_ID}`;
  };

  // Update view when center or zoom changes
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      longitude: center[1],
      latitude: center[0],
      zoom: zoom
    }));
  }, [center, zoom]);

  // Handler for when map loads
  const handleMapLoad = (event) => {
    console.log('🗺️ Map onLoad event fired!');
    setMapLoaded(true);
  };

  // Smooth out mouse interactions (pan/zoom/rotate) in 2D view
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    try {
      // Make scroll zoom slower and smoother
      if (map.scrollZoom && typeof map.scrollZoom.setWheelZoomRate === 'function') {
        map.scrollZoom.setWheelZoomRate(1 / 700); // default is 1/450, so this is gentler
      }

      // Increase inertia for drag panning (smoother glide)
      if (map.dragPan && typeof map.dragPan.setInertia === 'function') {
        map.dragPan.setInertia(0.9); // closer to 1 = longer glide
      }
    } catch (e) {
      console.debug('Could not adjust 2D mouse interaction smoothing', e);
    }
  }, [mapLoaded]);

  // Add hover interactions for district layers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) {
      console.log('⏳ Waiting for map to load...', { hasRef: !!mapRef.current, mapLoaded });
      return;
    }

    const map = mapRef.current.getMap();
    console.log('🚀 MapView2D useEffect triggered - setting up hover interactions');

    let hoveredFeatureId = null;
    let currentLayer = null;
    let fixedPopup = null;
    let isPopupFixed = false;

    // Helper function to create popup content (uses current language prop)
    const createPopupContent = (layerConfig, isFixed) => {
      const currentLang = language || 'en'; // Fallback to English
      const subtitle = isFixed
        ? `${currentLang === 'tr' ? 'Kapatmak için X\'e tıklayın' : 'Click X to close'}`
        : `${currentLang === 'tr' ? 'Sabitlemek için tıklayın' : 'Click to pin this popup'}`;

      // Custom header text: use a special title for T1, otherwise the layer name
      const title = layerConfig.id === 'T1'
        ? 'T1 Drift'
        : layerConfig.name;

      // Custom body text per layer where needed
      let bodyText;
      if (layerConfig.id === 'A1') {
        bodyText = 'The rocky shore and coral by the Yassıada, the notoriously famous former political prison on an Island in the Marmara Sea, formerly an agricultural experiment with donkeys and cotton, which has been transformed into an exclusive hotel and a museum, with concrete landing piers on its shores.';
      } else if (layerConfig.id === 'D1') {
        bodyText = 'Istanbul Haritası, 1:25000: 35 Eyüp, Great Britain. Army. Middle East Drawing and Reproduction, 1944';
      } else if (layerConfig.id === 'G1') {
        bodyText = '41.2692° N, 28.6908° area Sattelite Image Google Earth 2008  Landsat7 (NASA, USGIS)';
      } else if (layerConfig.id === 'T1') {
        bodyText = 'T1 Drift';
      } else if (layerConfig.id === 'T2') {
        bodyText = 'Transit Zone T2: alternative and emerging mobility corridors on the water, including informal crossings and seasonal connections.';
      } else {
        bodyText = `${layerConfig.category} - Information about this ${layerConfig.category.toLowerCase()} area will be displayed here once you upload your content.`;
      }

      return `
        <div style="padding: 12px; min-width: 200px; background: rgba(255,255,255,0.85); border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
          <div style="margin-bottom: 8px;">
            <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 4px 0; color: #111827;">
              ${title}
            </h3>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">
              ${subtitle}
            </p>
          </div>
          ${layerConfig.id === 'A1'
          ? `<div style="border-radius: 4px; overflow: hidden; margin: 8px 0;">
                 <img src="${ADA1Img}" alt="ADA1" style="width: 100%; display: block; object-fit: cover; max-height: 220px;" />
               </div>`
          : layerConfig.id === 'D1'
            ? `<div style="border-radius: 4px; overflow: hidden; margin: 8px 0;">
                 <img src="${DERE1Img}" alt="DERE1" style="width: 100%; display: block; object-fit: cover; max-height: 220px;" />
               </div>`
            : layerConfig.id === 'G1'
              ? `<div style="border-radius: 4px; overflow: hidden; margin: 8px 0;">
                 <img src="${GOL1Img}" alt="GOL1" style="width: 100%; display: block; object-fit: cover; max-height: 220px;" />
               </div>`
              : layerConfig.id === 'T1'
                ? `<div style="border-radius: 4px; overflow: hidden; margin: 8px 0;">
                 <img src="${SES1Img}" alt="SES1" style="width: 100%; display: block; object-fit: cover; max-height: 220px;" />
               </div>`
                : layerConfig.id === 'T2'
                  ? `<div style="border-radius: 4px; overflow: hidden; margin: 8px 0;">
                 <img src="${SES2Img}" alt="SES2" style="width: 100%; display: block; object-fit: cover; max-height: 220px;" />
               </div>`
                  : `<div style="background: rgba(59,130,246,0.75); border-radius: 4px; padding: 40px; margin: 8px 0; text-align: center; color: white;">
                 <strong>Placeholder Image</strong><br>
                 <span style="font-size: 11px;">[Your content will go here]</span>
               </div>`
        }
          <p style="font-size: 14px; color: #374151; margin: 8px 0;">
            ${bodyText}
          </p>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">
              <strong>Details:</strong><br>
              Type: ${layerConfig.category}<br>
              Phase: ${isFixed ? 'Active' : 'Planning'}
            </p>
          </div>
        </div>
      `;
    };

    // Helper function to clear hover state
    const clearHoverState = () => {
      if (hoveredFeatureId !== null && currentLayer) {
        try {
          map.setFeatureState(
            { source: 'composite', sourceLayer: currentLayer.id, id: hoveredFeatureId },
            { hover: false }
          );
        } catch (e) {
          console.debug('Feature state not available');
        }
      }
      hoveredFeatureId = null;
      currentLayer = null;
    };

    // Wait for style to load before adding interactions
    const initializeHoverEvents = () => {
      console.log('🗺️ Initializing 2D hover events for district layers');

      // List all available layers
      const allLayers = map.getStyle().layers;
      console.log('📋 All available layers:', allLayers.map(l => l.id));

      Object.values(LAYER_CONFIG).forEach(layerConfig => {
        const layerId = layerConfig.id;

        // Check if layer exists
        const layer = map.getLayer(layerId);
        if (!layer) {
          console.log(`❌ Layer ${layerId} NOT FOUND in style`);
          return;
        }

        console.log(`✅ Layer ${layerId} found! Type: ${layer.type}, Source: ${layer.source}`);

        // Update layer paint properties for hover effects using feature-state
        try {
          map.setPaintProperty(layerId, 'line-color', [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ff0000', // Bright red on hover
            layerConfig.color // Original color
          ]);

          map.setPaintProperty(layerId, 'line-width', [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            5, // Thicker on hover
            3 // Original width
          ]);
        } catch (e) {
          console.debug(`Could not set feature-state paint properties for ${layerId}`);
        }

        // Mouse enter: highlight the feature only (no hover popup)
        const handleMouseEnter = (e) => {
          // Don't show hover popup if there's already a fixed popup
          if (isPopupFixed) return;

          if (e.features && e.features.length > 0) {
            console.log(`🖱️ Mouse entered layer: ${layerId}`);
            map.getCanvas().style.cursor = 'pointer';

            // Clear previous hover state
            clearHoverState();

            // Set new hover state
            const feature = e.features[0];
            hoveredFeatureId = feature.id;
            currentLayer = layerConfig;

            try {
              map.setFeatureState(
                { source: 'composite', sourceLayer: layerId, id: hoveredFeatureId },
                { hover: true }
              );
            } catch (e) {
              console.debug('Feature state not available');
            }
          }
        };

        // Mouse leave: remove highlight and popup (only if not fixed)
        const handleMouseLeave = () => {
          // Don't remove popup if it's fixed
          if (isPopupFixed) return;

          map.getCanvas().style.cursor = '';

          // Remove hover state
          clearHoverState();

        };

        // Click on layer: fix the popup
        const handleClick = (e) => {
          if (e.features && e.features.length > 0) {
            console.log(`🖱️ Clicked layer: ${layerId}`);

            // Remove any existing fixed popup
            if (fixedPopup) {
              fixedPopup.remove();
            }

            // Create a new fixed popup
            const coordinates = e.lngLat;
            const fixedPopupContent = createPopupContent(layerConfig, true);

            fixedPopup = new mapboxgl.Popup({
              closeButton: true,
              closeOnClick: false,
              maxWidth: '300px'
            })
              .setLngLat(coordinates)
              .setHTML(fixedPopupContent)
              .addTo(map);

            // Add fixed popup styling
            fixedPopup.on('open', () => {
              const popupElement = fixedPopup.getElement();
              if (popupElement) {
                popupElement.querySelector('.mapboxgl-popup-content').classList.add('popup-fixed');
              }
            });

            // Handle fixed popup close
            fixedPopup.on('close', () => {
              isPopupFixed = false;
              fixedPopup = null;
            });

            isPopupFixed = true;
          }
        };

        // Attach event listeners
        map.on('mouseenter', layerId, handleMouseEnter);
        map.on('mouseleave', layerId, handleMouseLeave);
        map.on('click', layerId, handleClick);
      });
    };

    // Wait for style to load
    const onStyleLoad = () => {
      console.log('🎨 Map style loaded, waiting for layers...');
      // Add a small delay to ensure all layers are fully loaded
      setTimeout(() => {
        console.log('⏰ Initializing hover events after delay');
        initializeHoverEvents();
      }, 1000);
    };

    if (map.isStyleLoaded()) {
      console.log('✅ Style already loaded');
      setTimeout(() => {
        initializeHoverEvents();
      }, 500);
    } else {
      console.log('⏳ Waiting for style to load...');
      map.on('style.load', onStyleLoad);
    }

    // Cleanup
    return () => {
      map.off('style.load', onStyleLoad);
      Object.values(LAYER_CONFIG).forEach(layerConfig => {
        const layerId = layerConfig.id;
        map.off('mouseenter', layerId);
        map.off('mouseleave', layerId);
        map.off('click', layerId);
      });
      clearHoverState();
      if (fixedPopup) {
        fixedPopup.remove();
      }
    };
  }, [mapLoaded]); // Run when map loads

  // Initialize DrawingOverlay (persistent edit toolbar)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current.getMap();
    const container = map.getContainer();

    if (!drawingOverlayRef.current) {
      drawingOverlayRef.current = new DrawingOverlay(container, {
        toolbar: true,
        strokeWidth: 2,
        strokeStyle: '#ff6b6b',
        simplifyTolerance: 2,
        toLngLat: (pt) => {
          const lngLat = map.unproject([pt.x, pt.y]);
          return { lng: lngLat.lng, lat: lngLat.lat };
        },
        fromLngLat: (ll) => {
          const point = map.project([ll.lng, ll.lat]);
          return { x: point.x, y: point.y };
        },
        onSave: async (payload) => {
          console.log('Drawing saved:', payload);
          alert(`Drawing saved! ${payload.geojson.features.length} paths`);
        }
      });
    }

    return () => {
      if (drawingOverlayRef.current) {
        drawingOverlayRef.current.destroy();
        drawingOverlayRef.current = null;
      }
    };
  }, [mapLoaded]);

  const translations = {
    tr: {
      delete: 'Sil',
      confirmDelete: 'Bu metin kutusunu silmek istediğinizden emin misiniz?'
    },
    en: {
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete this text box?'
    }
  };

  const t = translations[language];

  const handleDeleteTextBox = (e, textBoxId) => {
    e.stopPropagation();
    if (window.confirm(t.confirmDelete)) {
      onDeleteTextBox(textBoxId);
      setSelectedTextBox(null);
    }
  };

  const handleTextBoxMarkerClick = (textBox) => {
    setSelectedTextBox(textBox);
    if (onTextBoxClick) {
      onTextBoxClick(textBox);
    }
  };

  // Complete drawing when drawing mode is turned off
  useEffect(() => {
    // When drawing mode is turned off and we have points, complete the drawing
    if (!isDrawingMode && currentDrawing.length >= 2) {
      console.log('🛑 Drawing mode stopped, completing drawing with', currentDrawing.length, 'points');
      if (onDrawingComplete) {
        onDrawingComplete(currentDrawing);
      }
      setCurrentDrawing([]);
    }
  }, [isDrawingMode]);

  // Drawing functionality with click-to-add-points
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !isDrawingMode) return;

    const map = mapRef.current.getMap();
    map.getCanvas().style.cursor = 'crosshair';

    const handleClick = (e) => {
      const { lng, lat } = e.lngLat;
      console.log('📍 Point added:', { lat, lng });
      setCurrentDrawing(prev => [...prev, { lat, lng }]);
    };

    const handleDblClick = (e) => {
      e.preventDefault();
      console.log('✅ Double-click detected, finishing drawing');

      if (currentDrawing.length >= 2) {
        if (onDrawingComplete) {
          onDrawingComplete(currentDrawing);
        }
        setCurrentDrawing([]);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        console.log(`✅ ${e.key} pressed, finishing drawing`);

        if (currentDrawing.length >= 2) {
          if (onDrawingComplete) {
            onDrawingComplete(currentDrawing);
          }
          setCurrentDrawing([]);
        } else if (e.key === 'Escape') {
          // Cancel drawing
          setCurrentDrawing([]);
        }
      }
    };

    map.on('click', handleClick);
    map.on('dblclick', handleDblClick);
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDblClick);
      window.removeEventListener('keydown', handleKeyPress);
      map.getCanvas().style.cursor = '';
    };
  }, [isDrawingMode, mapLoaded, currentDrawing, onDrawingComplete]);

  // Render current drawing line on map
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || currentDrawing.length === 0) return;

    const map = mapRef.current.getMap();

    // Remove existing drawing layers
    if (map.getLayer('current-drawing-line')) {
      map.removeLayer('current-drawing-line');
    }
    if (map.getLayer('current-drawing-points')) {
      map.removeLayer('current-drawing-points');
    }
    if (map.getSource('current-drawing')) {
      map.removeSource('current-drawing');
    }

    // Add points source (always show points, even with 1 point)
    map.addSource('current-drawing', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: currentDrawing.map(p => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [p.lng, p.lat]
          }
        }))
      }
    });

    // Point markers layer (always visible)
    map.addLayer({
      id: 'current-drawing-points',
      type: 'circle',
      source: 'current-drawing',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ff6b6b',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 1
      }
    });

    // Add line layer if more than 1 point
    if (currentDrawing.length >= 2) {
      map.addSource('current-drawing-line', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: currentDrawing.map(p => [p.lng, p.lat])
          }
        }
      });

      map.addLayer({
        id: 'current-drawing-line',
        type: 'line',
        source: 'current-drawing-line',
        paint: {
          'line-color': '#ff6b6b',
          'line-width': 4,
          'line-opacity': 0.9
        }
      }, 'current-drawing-points'); // Add line below points
    }

    return () => {
      if (map.getLayer('current-drawing-line')) {
        map.removeLayer('current-drawing-line');
      }
      if (map.getLayer('current-drawing-points')) {
        map.removeLayer('current-drawing-points');
      }
      if (map.getSource('current-drawing-line')) {
        map.removeSource('current-drawing-line');
      }
      if (map.getSource('current-drawing')) {
        map.removeSource('current-drawing');
      }
    };
  }, [currentDrawing, mapLoaded]);

  // Render completed but unsaved drawings (drawnPaths)
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || drawnPaths.length === 0) return;

    const map = mapRef.current.getMap();

    // Remove existing completed drawings layers
    if (map.getLayer('unsaved-drawings-line')) {
      map.removeLayer('unsaved-drawings-line');
    }
    if (map.getLayer('unsaved-drawings-points')) {
      map.removeLayer('unsaved-drawings-points');
    }
    if (map.getSource('unsaved-drawings')) {
      map.removeSource('unsaved-drawings');
    }

    // Create features for all completed drawings
    const lineFeatures = [];
    const pointFeatures = [];

    drawnPaths.forEach((path, index) => {
      if (path.length >= 2) {
        // Add line feature
        lineFeatures.push({
          type: 'Feature',
          properties: { drawingIndex: index },
          geometry: {
            type: 'LineString',
            coordinates: path.map(p => [p.lng, p.lat])
          }
        });

        // Add point features
        path.forEach(p => {
          pointFeatures.push({
            type: 'Feature',
            properties: { drawingIndex: index },
            geometry: {
              type: 'Point',
              coordinates: [p.lng, p.lat]
            }
          });
        });
      }
    });

    if (lineFeatures.length > 0) {
      // Add source with all completed drawings
      map.addSource('unsaved-drawings', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [...lineFeatures, ...pointFeatures]
        }
      });

      // Add line layer
      map.addLayer({
        id: 'unsaved-drawings-line',
        type: 'line',
        source: 'unsaved-drawings',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': '#ff6b6b',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Add points layer
      map.addLayer({
        id: 'unsaved-drawings-points',
        type: 'circle',
        source: 'unsaved-drawings',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#ff6b6b',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9
        }
      });
    }

    return () => {
      if (map.getLayer('unsaved-drawings-line')) {
        map.removeLayer('unsaved-drawings-line');
      }
      if (map.getLayer('unsaved-drawings-points')) {
        map.removeLayer('unsaved-drawings-points');
      }
      if (map.getSource('unsaved-drawings')) {
        map.removeSource('unsaved-drawings');
      }
    };
  }, [drawnPaths, mapLoaded]);

  // Render saved drawings (always visible)
  useEffect(() => {
    console.log('🗺️ Saved drawings effect triggered:', {
      hasMap: !!mapRef.current,
      mapLoaded,
      drawingsCount: savedDrawings.length,
      drawings: savedDrawings.map(d => ({ id: d.id, title: d.title }))
    });

    if (!mapRef.current || !mapLoaded || savedDrawings.length === 0) {
      console.log('⚠️ Skipping saved drawings render:', {
        hasMap: !!mapRef.current,
        mapLoaded,
        drawingsCount: savedDrawings.length
      });
      return;
    }

    const map = mapRef.current.getMap();

    // Remove existing saved drawings
    if (map.getLayer('saved-drawings-line')) {
      map.removeLayer('saved-drawings-line');
    }
    if (map.getLayer('saved-drawings-points')) {
      map.removeLayer('saved-drawings-points');
    }
    if (map.getSource('saved-drawings')) {
      map.removeSource('saved-drawings');
    }

    console.log('🎨 Rendering', savedDrawings.length, 'saved drawings');

    // Create features for all saved drawings
    const lineFeatures = [];
    const pointFeatures = [];

    savedDrawings.forEach((drawing) => {
      if (drawing.coordinates && drawing.coordinates.length >= 2) {
        // Add line feature
        lineFeatures.push({
          type: 'Feature',
          properties: {
            id: drawing.id,
            title: drawing.title,
            description: drawing.description,
            contributor: drawing.contributor_name,
            color: drawing.style?.color || '#ff6b6b'
          },
          geometry: {
            type: 'LineString',
            coordinates: drawing.coordinates.map(c => [c[1], c[0]]) // [lng, lat]
          }
        });

        // Add point features
        drawing.coordinates.forEach(c => {
          pointFeatures.push({
            type: 'Feature',
            properties: {
              id: drawing.id,
              color: drawing.style?.color || '#ff6b6b'
            },
            geometry: {
              type: 'Point',
              coordinates: [c[1], c[0]] // [lng, lat]
            }
          });
        });
      }
    });

    if (lineFeatures.length > 0) {
      // Add source
      map.addSource('saved-drawings', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [...lineFeatures, ...pointFeatures]
        }
      });

      // Add line layer
      map.addLayer({
        id: 'saved-drawings-line',
        type: 'line',
        source: 'saved-drawings',
        filter: ['==', ['geometry-type'], 'LineString'],
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4,
          'line-opacity': 0.8
        }
      });

      // Add points layer
      map.addLayer({
        id: 'saved-drawings-points',
        type: 'circle',
        source: 'saved-drawings',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.8
        }
      });

      // Add hover handler for saved drawings
      const handleDrawingMouseEnter = (e) => {
        if (e.features.length > 0) {
          const feature = e.features[0];
          const drawingId = feature.properties.id;
          const drawing = savedDrawings.find(d => d.id === drawingId);
          if (drawing) {
            setHoveredDrawing(drawing);
          }
        }
      };

      const handleDrawingMouseLeave = () => {
        setHoveredDrawing(null);
      };

      // Add click handler for saved drawings
      const handleDrawingClick = (e) => {
        console.log('👆 Click event on drawing layer:', e.features?.length, 'features');
        if (e.features.length > 0) {
          const feature = e.features[0];
          const drawingId = feature.properties.id;
          console.log('🎯 Drawing ID from feature:', drawingId);
          const drawing = savedDrawings.find(d => d.id === drawingId);
          console.log('🔍 Found drawing:', drawing ? drawing.title : 'NOT FOUND');
          if (drawing && onDrawingPinClick) {
            console.log('🎨 Drawing clicked - calling onDrawingPinClick:', drawing.title);
            onDrawingPinClick(drawing);
          } else {
            console.warn('⚠️ Drawing not found or no callback:', { drawing, hasCallback: !!onDrawingPinClick });
          }
        } else {
          console.warn('⚠️ No features in click event');
        }
      };

      // Add hover cursor and click handlers for LINES
      map.on('mouseenter', 'saved-drawings-line', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        handleDrawingMouseEnter(e);
      });
      map.on('mouseleave', 'saved-drawings-line', () => {
        map.getCanvas().style.cursor = '';
        handleDrawingMouseLeave();
      });
      map.on('click', 'saved-drawings-line', handleDrawingClick);

      // Add hover cursor and click handlers for POINTS (nodes)
      map.on('mouseenter', 'saved-drawings-points', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        handleDrawingMouseEnter(e);
      });
      map.on('mouseleave', 'saved-drawings-points', () => {
        map.getCanvas().style.cursor = '';
        handleDrawingMouseLeave();
      });
      map.on('click', 'saved-drawings-points', handleDrawingClick);

      return () => {
        // Remove line handlers
        map.off('click', 'saved-drawings-line', handleDrawingClick);
        map.off('mouseenter', 'saved-drawings-line');
        map.off('mouseleave', 'saved-drawings-line');
        // Remove point handlers
        map.off('click', 'saved-drawings-points', handleDrawingClick);
        map.off('mouseenter', 'saved-drawings-points');
        map.off('mouseleave', 'saved-drawings-points');
        if (map.getLayer('saved-drawings-line')) {
          map.removeLayer('saved-drawings-line');
        }
        if (map.getLayer('saved-drawings-points')) {
          map.removeLayer('saved-drawings-points');
        }
        if (map.getSource('saved-drawings')) {
          map.removeSource('saved-drawings');
        }
      };
    }
  }, [savedDrawings, mapLoaded, onDrawingPinClick]);


  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onLoad={handleMapLoad}
        onClick={(e) => {
          const { lng, lat } = e.lngLat;
          if (isLocationMode && onLocationSelect) {
            onLocationSelect({ lat, lng });
          } else if (isTextBoxMode && onTextBoxLocationSelect) {
            onTextBoxLocationSelect({ lat, lng });
          }
        }}
        mapStyle={getStyleUrl()}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        dragPan={!(isDrawingMode || isTextBoxMode)}
        dragRotate={!(isDrawingMode || isTextBoxMode)}
        scrollZoom={true}
        doubleClickZoom={!(isDrawingMode || isTextBoxMode)}
        cursor={
          isDrawingMode || isTextBoxMode
            ? 'crosshair' // plus-style cursor for drawing and text box location select
            : 'grab'
        }
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        {/* Pending Text Box Location Marker (shown immediately after map click) */}
        {isTextBoxMode && textBoxCoords && (
          <Marker
            longitude={textBoxCoords.lng}
            latitude={textBoxCoords.lat}
            anchor="center"
          >
            <div
              className="bg-blue-500 text-white rounded-full p-2 shadow-lg border-2 border-white"
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <MessageSquare size={16} />
            </div>
          </Marker>
        )}

        {/* Hover Popup for Drawing */}
        {hoveredDrawing && !selectedDrawing && (
          <Popup
            longitude={hoveredDrawing.coordinates[0][1]}
            latitude={hoveredDrawing.coordinates[0][0]}
            anchor="top"
            onClose={() => setHoveredDrawing(null)}
            closeButton={false}
            closeOnClick={false}
            className="drawing-hover-popup"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-3 min-w-[200px] max-w-[300px]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {hoveredDrawing.title || 'Drawing'}
                  </h3>
                  {hoveredDrawing.category && (
                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full mt-1">
                      {hoveredDrawing.category}
                    </span>
                  )}
                </div>
              </div>
              {hoveredDrawing.description && (
                <p className="text-gray-600 text-xs leading-relaxed mb-2">
                  {hoveredDrawing.description.substring(0, 80)}{hoveredDrawing.description.length > 80 ? '...' : ''}
                </p>
              )}
              <p className="text-xs text-gray-500 italic">
                Click for details
              </p>
            </div>
          </Popup>
        )}

        {/* Clicked Drawing Popup */}
        {selectedDrawing && selectedDrawing.coordinates && selectedDrawing.coordinates.length > 0 && (() => {
          // Calculate coordinates
          const firstCoord = selectedDrawing.coordinates[0];
          const lng = Array.isArray(firstCoord) ? firstCoord[1] : firstCoord.lng;
          const lat = Array.isArray(firstCoord) ? firstCoord[0] : firstCoord.lat;

          console.log('✅ RENDERING POPUP for:', selectedDrawing.title, '@ coords:', { lat, lng });

          return (
            <Popup
              longitude={lng}
              latitude={lat}
              anchor="bottom"
              onClose={() => {
                console.log('❌ Closing drawing popup');
                if (onDrawingPinClick) onDrawingPinClick(null);
              }}
              closeButton={false}
              className="drawing-popup"
            >
              <div className="bg-white rounded-lg shadow-2xl p-4 min-w-[280px] max-w-[350px]">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-base mb-1">
                      {selectedDrawing.title || 'Drawing'}
                    </h3>
                    {selectedDrawing.category && (
                      <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {selectedDrawing.category}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      console.log('❌ Close button clicked');
                      if (onDrawingPinClick) onDrawingPinClick(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors ml-2 p-2 hover:bg-gray-100 rounded-full"
                    title="Close"
                  >
                    <X size={22} />
                  </button>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  {selectedDrawing.description && (
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {selectedDrawing.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-2">
                    {selectedDrawing.length_meters && (
                      <div className="bg-blue-50 rounded-lg p-2.5">
                        <p className="text-xs text-blue-600 font-medium">Length</p>
                        <p className="text-sm font-bold text-blue-900">
                          {selectedDrawing.length_meters}m
                        </p>
                      </div>
                    )}
                    {selectedDrawing.coordinates && (
                      <div className="bg-green-50 rounded-lg p-2.5">
                        <p className="text-xs text-green-600 font-medium">Points</p>
                        <p className="text-sm font-bold text-green-900">
                          {selectedDrawing.coordinates.length}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="pt-2 border-t border-gray-200 space-y-1.5">
                    {selectedDrawing.contributor_name && (
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold">Contributor:</span> {selectedDrawing.contributor_name}
                      </p>
                    )}
                    {selectedDrawing.created_date && (
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold">Date:</span> {new Date(selectedDrawing.created_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        console.log('❌ Close button (bottom) clicked');
                        if (onDrawingPinClick) onDrawingPinClick(null);
                      }}
                      className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded transition-colors"
                    >
                      {language === 'tr' ? 'Kapat' : 'Close'}
                    </button>
                    {onDeleteDrawing && (
                      <button
                        onClick={() => {
                          console.log('🗑️ Delete button clicked');
                          if (window.confirm(language === 'tr' ? 'Bu çizimi silmek istediğinizden emin misiniz?' : 'Are you sure you want to delete this drawing?')) {
                            onDeleteDrawing(selectedDrawing.id);
                            if (onDrawingPinClick) onDrawingPinClick(null);
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X size={14} />
                        {language === 'tr' ? 'Sil' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Popup>
          );
        })()}

        {/* Text Box Markers */}
        {console.log('🔍 TextBox Rendering:', { showTextBoxes, textBoxCount: textBoxes?.length, textBoxes })}
        {showTextBoxes && textBoxes && textBoxes.map((textBox) => (
          <Marker
            key={textBox.id}
            longitude={textBox.coords.lng}
            latitude={textBox.coords.lat}
            anchor="center"
            onClick={() => handleTextBoxMarkerClick(textBox)}
          >
            <div
              className="bg-blue-500 text-white rounded-full p-2 cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
              style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={() => setHoveredTextBox(textBox)}
              onMouseLeave={() => setHoveredTextBox(null)}
            >
              <MessageSquare size={16} />
            </div>
          </Marker>
        ))}

        {/* Hover Popup for TextBox */}
        {hoveredTextBox && !selectedTextBox && (
          <Popup
            longitude={hoveredTextBox.coords.lng}
            latitude={hoveredTextBox.coords.lat}
            anchor="top"
            onClose={() => setHoveredTextBox(null)}
            closeButton={false}
            closeOnClick={false}
            className="textbox-hover-popup"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-3 min-w-[200px] max-w-[300px]">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  <MessageSquare size={16} className="text-blue-500" />
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {hoveredTextBox.title || 'Text Note'}
                  </h3>
                </div>
                {onDeleteTextBox && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(t.confirmDelete)) {
                        onDeleteTextBox(hoveredTextBox.id);
                        setHoveredTextBox(null);
                      }
                    }}
                    className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <p className="text-gray-700 text-xs leading-relaxed line-clamp-3">
                {hoveredTextBox.content}
              </p>
              {hoveredTextBox.contributor_name && (
                <p className="text-xs text-gray-500 mt-2">
                  By: {hoveredTextBox.contributor_name}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1 italic">
                Click for details
              </p>
            </div>
          </Popup>
        )}

        {/* Clicked TextBox Popup - Full Details */}
        {selectedTextBox && (
          <Popup
            longitude={selectedTextBox.coords.lng}
            latitude={selectedTextBox.coords.lat}
            anchor="bottom"
            onClose={() => setSelectedTextBox(null)}
            closeButton={false}
            closeOnClick={false}
            className="textbox-popup"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl p-4 min-w-[250px] max-w-[350px]">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-blue-500" />
                  <h3 className="font-semibold text-gray-800">
                    {selectedTextBox.title || 'Text Note'}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedTextBox(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {selectedTextBox.content}
                </p>

                {/* Metadata */}
                <div className="pt-2 border-t border-gray-200 space-y-1">
                  {selectedTextBox.coords && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Location:</span> {selectedTextBox.coords.lat.toFixed(6)}, {selectedTextBox.coords.lng.toFixed(6)}
                    </p>
                  )}
                  {selectedTextBox.contributor_name && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">By:</span> {selectedTextBox.contributor_name}
                    </p>
                  )}
                  {selectedTextBox.timestamp && (
                    <p className="text-xs text-gray-500">
                      <span className="font-medium">Date:</span> {new Date(selectedTextBox.timestamp).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {onDeleteTextBox && (
                  <button
                    onClick={() => {
                      if (window.confirm(t.confirmDelete)) {
                        onDeleteTextBox(selectedTextBox.id);
                        setSelectedTextBox(null);
                      }
                    }}
                    className="mt-3 w-full px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors flex items-center justify-center gap-2"
                  >
                    <X size={14} />
                    {t.delete}
                  </button>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
