import React, { useRef, useEffect, useState } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl, GeolocateControl } from 'react-map-gl';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MessageSquare } from 'lucide-react';
import { Drawing, Contribution, WorkshopMedia } from '@/api/entities';
import { DrawingOverlay } from '@/utils/DrawingOverlay';

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_USERNAME = "gokcenerkilic";
const MAPBOX_STYLE_ID = "cm7et6tk1003o01qpfltz19qs";

export default function MapView3D({
  center,
  zoom,
  activeLayer,
  language,
  onMapLoad,
  textBoxes,
  showTextBoxes,
  onTextBoxClick,
  onDeleteTextBox,
  onMediaClick
}) {
  const mapRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: center[1],
    latitude: center[0],
    zoom: Math.max(zoom, 15), // Ensure minimum zoom of 15 to see buildings
    pitch: 45, // 3D tilt angle (45 degrees is optimal for buildings)
    bearing: -17.6 // Slight rotation for better perspective
  });

  const [terrainEnabled, setTerrainEnabled] = useState(true);
  const [buildingsEnabled, setBuildingsEnabled] = useState(true);
  const [selectedTextBox, setSelectedTextBox] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [selectedContribution, setSelectedContribution] = useState(null);
  const drawingOverlayRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [show3DControls, setShow3DControls] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // If there is no Mapbox token configured, show a clear in-app message
  if (!MAPBOX_ACCESS_TOKEN) {
    console.error("VITE_MAPBOX_ACCESS_TOKEN is not set. Create a .env file with your Mapbox token.");
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white text-center p-4">
        <div>
          <p className="font-semibold mb-2">Mapbox 3D view is not configured.</p>
          <p className="text-sm opacity-80">
            Set <span className="font-mono">VITE_MAPBOX_ACCESS_TOKEN</span> in a local <span className="font-mono">.env</span> file
            using your Mapbox access token, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

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

  // Load drawings
  useEffect(() => {
    const loadDrawings = async () => {
      try {
        const data = await Drawing.filter({ status: 'approved' });
        const validDrawings = data.filter(drawing => drawing.coordinates && drawing.coordinates.length > 0);
        console.log('🎨 Loaded drawings:', validDrawings.length, validDrawings);
        setDrawings(validDrawings);
      } catch (error) {
        console.error('Error loading drawings:', error);
      }
    };
    loadDrawings();
  }, []);

  // Load contributions
  useEffect(() => {
    const loadContributions = async () => {
      try {
        const data = await Contribution.filter({ status: 'approved' });
        setContributions(data);
      } catch (error) {
        console.error('Error loading contributions:', error);
      }
    };
    loadContributions();
  }, [language]);

  // Load workshop media
  useEffect(() => {
    const loadWorkshopMedia = async () => {
      try {
        const data = await WorkshopMedia.list('-created_date');
        setMediaItems(data.filter(item => item.latitude && item.longitude));
      } catch (error) {
        console.error('Error loading workshop media:', error);
      }
    };
    loadWorkshopMedia();
  }, []);

  // Add hover interactions for drawing lines (EXACT implementation from main branch using native Mapbox popups)
  useEffect(() => {
    if (!mapRef.current || drawings.length === 0) return;
    const map = mapRef.current.getMap();

    // Wait for map to be fully loaded and layers to be added
    const initializeHoverEvents = () => {
      let hoveredFeatureIdLocal = null;
      let currentLayerId = null;
      let fixedPopup = null;
      let isPopupFixed = false;

      // Create a popup instance for hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        maxWidth: '300px'
      });

      // Helper function to create popup content
      const createPopupContent = (drawing, isFixed) => {
        const subtitle = isFixed
          ? `${language === 'tr' ? 'Kapatmak için X\'e tıklayın' : 'Click X to close'}`
          : `${language === 'tr' ? 'Sabitlemek için tıklayın' : 'Click to pin this popup'}`;
        const title = drawing.title || 'Drawing';

        return `
        <div style="padding: 8px;">
          <div style="margin-bottom: 8px;">
            <h3 style="font-weight: bold; font-size: 16px; margin: 0 0 4px 0; color: #111827;">
              ${title}
            </h3>
            <p style="font-size: 12px; color: #6b7280; margin: 0;">
              ${subtitle}
            </p>
          </div>
          ${drawing.description ? `
            <p style="font-size: 14px; color: #374151; margin: 8px 0;">
              ${drawing.description}
            </p>
          ` : ''}
          ${drawing.contributor_name && isFixed ? `
            <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">
              ${language === 'tr' ? 'Katkıda bulunan' : 'Contributed by'}: ${drawing.contributor_name}
            </p>
          ` : ''}
        </div>
      `;
      };

      // Helper function to clear hover state
      const clearHoverState = () => {
        if (hoveredFeatureIdLocal !== null && currentLayerId) {
          try {
            map.setFeatureState(
              { source: `drawing-${hoveredFeatureIdLocal}`, id: hoveredFeatureIdLocal },
              { hover: false }
            );
          } catch (e) {
            console.debug('Feature state not available');
          }
        }
        hoveredFeatureIdLocal = null;
        currentLayerId = null;
      };

      drawings.forEach(drawing => {
        const layerId = `drawing-layer-${drawing.id}`;
        const sourceId = `drawing-${drawing.id}`;

        // Update layer paint properties for hover effects using feature-state
        try {
          map.setPaintProperty(layerId, 'line-color', [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            '#ff0000', // Highlight color (bright red)
            drawing.style?.color || '#ff6b6b' // Original color
          ]);

          map.setPaintProperty(layerId, 'line-width', [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            5, // Highlight width
            drawing.style?.weight || 3 // Original width
          ]);
        } catch (e) {
          console.debug('Could not set feature-state paint properties');
        }

        // Mouse enter: highlight the feature and show popup
        const handleMouseEnter = (e) => {
          console.log('🖱️ Mouse entered layer:', layerId, e);

          // Don't show hover popup if there's already a fixed popup
          if (isPopupFixed) {
            console.log('  ⏸️ Popup already fixed, skipping hover');
            return;
          }

          if (e.features && e.features.length > 0) {
            console.log('  ✅ Feature detected, showing popup');
            map.getCanvas().style.cursor = 'pointer';

            // Clear previous hover state
            clearHoverState();

            // Set new hover state
            hoveredFeatureIdLocal = drawing.id;
            currentLayerId = layerId;

            try {
              map.setFeatureState(
                { source: sourceId, id: hoveredFeatureIdLocal },
                { hover: true }
              );
            } catch (e) {
              console.debug('Feature state not available');
            }

            // Show popup
            const coordinates = e.lngLat;
            const popupContent = createPopupContent(drawing, false);

            popup.setLngLat(coordinates)
              .setHTML(popupContent)
              .addTo(map);

            console.log('  📍 Popup added at:', coordinates);
          } else {
            console.log('  ❌ No features found');
          }
        };

        // Mouse leave: remove highlight and popup (only if not fixed)
        const handleMouseLeave = () => {
          // Don't remove popup if it's fixed
          if (isPopupFixed) return;

          map.getCanvas().style.cursor = '';

          // Remove hover state
          clearHoverState();

          // Remove popup
          popup.remove();
        };

        // Click on layer: fix the popup
        const handleClick = (e) => {
          if (e.features.length > 0) {
            // Remove any existing fixed popup
            if (fixedPopup) {
              fixedPopup.remove();
            }

            // Create a new fixed popup
            const coordinates = e.lngLat;
            const fixedPopupContent = createPopupContent(drawing, true);

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

            // Remove the hover popup if it exists
            popup.remove();
          }
        };

        // Attach event listeners
        map.on('mouseenter', layerId, handleMouseEnter);
        map.on('mouseleave', layerId, handleMouseLeave);
        map.on('click', layerId, handleClick);
      });

      // Return cleanup function
      return () => {
        drawings.forEach(drawing => {
          const layerId = `drawing-layer-${drawing.id}`;
          map.off('mouseenter', layerId);
          map.off('mouseleave', layerId);
          map.off('click', layerId);
        });
        clearHoverState();
        popup.remove();
        if (fixedPopup) {
          fixedPopup.remove();
        }
      };
    }; // End of initializeHoverEvents

    // Wait for layers to be added, then initialize events
    const checkLayersAndInit = () => {
      console.log('🔍 Checking for drawing layers...', drawings.length);

      const layerStatus = drawings.map(drawing => {
        const layerId = `drawing-layer-${drawing.id}`;
        const exists = map.getLayer(layerId);
        console.log(`  Layer ${layerId}: ${exists ? '✅ exists' : '❌ missing'}`);
        return exists;
      });

      const allLayersExist = layerStatus.every(exists => exists);

      if (allLayersExist) {
        console.log('✅ All layers exist! Initializing hover events...');
        return initializeHoverEvents();
      } else {
        console.log('⏳ Waiting for layers to be added...');
        // Retry after a short delay
        const timeout = setTimeout(checkLayersAndInit, 100);
        return () => clearTimeout(timeout);
      }
    };

    const cleanup = checkLayersAndInit();
    return cleanup;
  }, [drawings, language]);

  // Initialize DrawingOverlay
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current.getMap();
    const container = map.getContainer();

    // Initialize drawing overlay with coordinate conversion
    if (!drawingOverlayRef.current) {
      drawingOverlayRef.current = new DrawingOverlay(container, {
        toolbar: true,
        strokeWidth: 2,
        strokeStyle: '#ff6b6b',
        simplifyTolerance: 2,
        onToggleEnabled: (enabled) => {
          setIsEditMode(enabled);
        },
        toLngLat: (pt) => {
          // Convert screen pixels to lng/lat
          const lngLat = map.unproject([pt.x, pt.y]);
          return { lng: lngLat.lng, lat: lngLat.lat };
        },
        fromLngLat: (ll) => {
          // Convert lng/lat to screen pixels
          const point = map.project([ll.lng, ll.lat]);
          return { x: point.x, y: point.y };
        },
        onSave: async (payload) => {
          console.log('Drawing saved:', payload);
          // Here you can save to your backend/database
          // For now, just log it
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

  // Enable 3D terrain and buildings when map loads
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap();

      const onStyleLoad = () => {
        // Add 3D terrain
        if (!map.getSource('mapbox-dem')) {
          map.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          });
        }

        if (terrainEnabled) {
          map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
        }

        // Add 3D buildings
        if (!map.getLayer('3d-buildings')) {
          const layers = map.getStyle().layers;
          const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
          )?.id;

          map.addLayer(
            {
              id: '3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 15,
              paint: {
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
              }
            },
            labelLayerId
          );
        }

        if (buildingsEnabled) {
          map.setLayoutProperty('3d-buildings', 'visibility', 'visible');
        } else {
          map.setLayoutProperty('3d-buildings', 'visibility', 'none');
        }

        if (onMapLoad) {
          onMapLoad(map);
        }
      };

      map.on('style.load', onStyleLoad);

      return () => {
        map.off('style.load', onStyleLoad);
      };
    }
  }, [terrainEnabled, buildingsEnabled, onMapLoad]);

  // Optional "game-like" keyboard controls for 3D camera (arrow keys)
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    const deltaDistance = 80; // pixels to pan up/down (smaller step)
    const deltaDegrees = 15;  // degrees to rotate left/right (smaller step)
    const easing = (t) => t * (2 - t);

    const onLoad = () => {
      const canvas = map.getCanvas();
      if (!canvas) return;

      // Ensure the canvas can receive keyboard focus
      if (!canvas.hasAttribute('tabindex')) {
        canvas.setAttribute('tabindex', '0');
      }
      canvas.focus();

      const handleKeyDown = (e) => {
        // Arrow key codes: 37=left, 38=up, 39=right, 40=down
        if (![37, 38, 39, 40].includes(e.which)) return;
        e.preventDefault();

        if (e.which === 38) {
          // up
          map.panBy([0, -deltaDistance], { duration: 1000, easing });
        } else if (e.which === 40) {
          // down
          map.panBy([0, deltaDistance], { duration: 1000, easing });
        } else if (e.which === 37) {
          // left
          map.easeTo({
            bearing: map.getBearing() - deltaDegrees,
            duration: 1200,
            easing
          });
        } else if (e.which === 39) {
          // right
          map.easeTo({
            bearing: map.getBearing() + deltaDegrees,
            duration: 1200,
            easing
          });
        }
      };

      canvas.addEventListener('keydown', handleKeyDown, true);

      // Cleanup function for this load event
      const cleanup = () => {
        canvas.removeEventListener('keydown', handleKeyDown, true);
      };

      // Store cleanup on map so we can remove if effect re-runs
      map.__keyboardGameControlsCleanup = cleanup;
    };

    if (map.loaded && map.loaded()) {
      // Map is already loaded, initialize controls immediately
      onLoad();
    } else {
      // Wait for the load event if not yet loaded
      map.on('load', onLoad);
    }

    return () => {
      map.off('load', onLoad);
      if (map.__keyboardGameControlsCleanup) {
        map.__keyboardGameControlsCleanup();
        delete map.__keyboardGameControlsCleanup;
      }
    };
  }, []);

  const translations = {
    tr: {
      terrain: 'Arazi',
      buildings: 'Binalar',
      delete: 'Sil',
      confirmDelete: 'Bu metin kutusunu silmek istediğinizden emin misiniz?'
    },
    en: {
      terrain: 'Terrain',
      buildings: 'Buildings',
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

  // Smooth camera controls for 3D mode (rotate / tilt / zoom via easeTo)
  const handleCameraControl = ({ deltaBearing = 0, deltaPitch = 0, deltaZoom = 0 }) => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    if (!map) return;

    const currentBearing = map.getBearing();
    const currentPitch = map.getPitch();
    const currentZoom = map.getZoom();

    const targetBearing = currentBearing + deltaBearing;
    const targetPitch = Math.max(0, Math.min(75, currentPitch + deltaPitch));
    const targetZoom = currentZoom + deltaZoom;

    map.easeTo({
      bearing: targetBearing,
      pitch: targetPitch,
      zoom: targetZoom,
      duration: 1400,
      easing: (t) => t * (2 - t)
    });
  };

  return (
    <div className="relative w-full h-full">
      {/* 3D camera controls */}
      <div className="absolute top-36 right-2 z-10 flex flex-col gap-1 bg-white/80 backdrop-blur-sm rounded-md shadow p-1">
        <button
          type="button"
          className="px-2 py-1 text-xs rounded hover:bg-gray-200"
          onClick={() => handleCameraControl({ deltaBearing: -15 })}
        >
          Rotate ◀
        </button>
        <button
          type="button"
          className="px-2 py-1 text-xs rounded hover:bg-gray-200"
          onClick={() => handleCameraControl({ deltaBearing: 15 })}
        >
          Rotate ▶
        </button>
        <button
          type="button"
          className="mt-1 px-2 py-1 text-xs rounded hover:bg-gray-200"
          onClick={() => handleCameraControl({ deltaPitch: 5 })}
        >
          Tilt ↓
        </button>
        <button
          type="button"
          className="px-2 py-1 text-xs rounded hover:bg-gray-200"
          onClick={() => handleCameraControl({ deltaPitch: -5 })}
        >
          Tilt ↑
        </button>
        <button
          type="button"
          className="mt-1 px-2 py-1 text-xs rounded hover:bg-gray-200"
          onClick={() => handleCameraControl({ deltaZoom: 0.5 })}
        >
          Zoom +
        </button>
        <button
          type="button"
          className="px-2 py-1 text-xs rounded hover:bg-gray-200"
          onClick={() => handleCameraControl({ deltaZoom: -0.5 })}
        >
          Zoom -
        </button>
      </div>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
        style={{ width: '100%', height: '100%' }}
        mapStyle={getStyleUrl()}
        antialias={true}
        cursor={isEditMode ? 'crosshair' : 'grab'}
        onLoad={() => setMapLoaded(true)}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl position="top-right" />

        {/* Text Box Markers */}
        {showTextBoxes && textBoxes && textBoxes.map((textBox) => (
          <Marker
            key={textBox.id}
            longitude={textBox.coords.lng}
            latitude={textBox.coords.lat}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedTextBox(textBox);
              if (onTextBoxClick) {
                onTextBoxClick(textBox);
              }
            }}
          >
            <div
              style={{
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
            >
              <MessageSquare
                style={{
                  color: 'white',
                  width: '18px',
                  height: '18px'
                }}
              />
            </div>
          </Marker>
        ))}

        {/* Text Box Popup */}
        {selectedTextBox && (
          <Popup
            longitude={selectedTextBox.coords.lng}
            latitude={selectedTextBox.coords.lat}
            anchor="bottom"
            onClose={() => setSelectedTextBox(null)}
            closeOnClick={false}
            maxWidth="300px"
          >
            <div className="p-2 min-w-[200px] max-w-[300px]">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-gray-900 flex-1">
                  {selectedTextBox.title}
                </h3>
                {onDeleteTextBox && (
                  <button
                    onClick={(e) => handleDeleteTextBox(e, selectedTextBox.id)}
                    className="ml-2 p-1.5 rounded-md hover:bg-red-100 text-red-600 hover:text-red-700 transition-colors"
                    title={t.delete}
                  >
                    ✕
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {selectedTextBox.content}
              </p>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {new Date(selectedTextBox.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </Popup>
        )}

        {/* Drawing Lines (Red Lines) with Hover Popup */}
        {drawings.map((drawing) => {
          const geojson = {
            type: 'Feature',
            properties: {
              id: drawing.id,
              title: drawing.title || 'Drawing',
              description: drawing.description
            },
            geometry: {
              type: 'LineString',
              coordinates: drawing.coordinates.map(coord => [coord[1], coord[0]])
            }
          };

          return (
            <Source key={`drawing-${drawing.id}`} id={`drawing-${drawing.id}`} type="geojson" data={geojson}>
              <Layer
                id={`drawing-layer-${drawing.id}`}
                type="line"
                paint={{
                  'line-color': drawing.style?.color || '#ff6b6b',
                  'line-width': drawing.style?.weight || 3,
                  'line-opacity': drawing.style?.opacity || 0.8
                }}
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round'
                }}
              />
            </Source>
          );
        })}

        {/* Contribution Markers */}
        {contributions.map((contribution) => (
          <Marker
            key={`contribution-${contribution.id}`}
            longitude={contribution.longitude}
            latitude={contribution.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedContribution(contribution);
            }}
          >
            <div
              style={{
                backgroundColor: '#3b82f6',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                cursor: 'pointer'
              }}
            />
          </Marker>
        ))}

        {/* Contribution Popup */}
        {selectedContribution && (
          <Popup
            longitude={selectedContribution.longitude}
            latitude={selectedContribution.latitude}
            anchor="bottom"
            onClose={() => setSelectedContribution(null)}
            closeOnClick={false}
            maxWidth="300px"
          >
            <div className="p-3 min-w-64">
              <h3 className="font-semibold text-lg mb-2 text-gray-900">
                {selectedContribution.title}
              </h3>
              {selectedContribution.description && (
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                  {selectedContribution.description}
                </p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {selectedContribution.category}
                </span>
                {selectedContribution.contributor_name && (
                  <span>{selectedContribution.contributor_name}</span>
                )}
              </div>
            </div>
          </Popup>
        )}

        {/* Workshop Media Markers */}
        {mediaItems.map((media) => (
          <Marker
            key={`media-${media.id}`}
            longitude={media.longitude}
            latitude={media.latitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (onMediaClick) {
                onMediaClick(media);
              }
            }}
          >
            <div
              style={{
                backgroundColor: media.media_type === 'audio' ? '#8b5cf6' : '#f59e0b',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '8px',
                color: 'white'
              }}
            >
              {media.media_type === 'audio' ? '♪' : '📷'}
            </div>
          </Marker>
        ))}

      </Map>

      {/* 3D Settings Toggle Button */}
      <button
        type="button"
        onClick={() => setShow3DControls(!show3DControls)}
        className={`absolute bottom-[60px] left-[22px] z-50 px-3 py-2 text-xs font-medium rounded-lg shadow-lg transition-all duration-200 ${show3DControls
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-gray-100'
          }`}
        title="Toggle 3D settings"
      >
        ⚙️ 3D
      </button>

      {/* 3D Controls Overlay - toggleable */}
      {show3DControls && (
        <div className="absolute bottom-[60px] left-[80px] z-50 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex flex-col gap-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={terrainEnabled}
                onChange={(e) => {
                  setTerrainEnabled(e.target.checked);
                  const map = mapRef.current?.getMap();
                  if (map) {
                    if (e.target.checked) {
                      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
                    } else {
                      map.setTerrain(null);
                    }
                  }
                }}
                className="w-4 h-4"
              />
              <span className="text-gray-700 font-medium">{t.terrain}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={buildingsEnabled}
                onChange={(e) => {
                  setBuildingsEnabled(e.target.checked);
                  const map = mapRef.current?.getMap();
                  if (map) {
                    const layer = map.getLayer('3d-buildings');
                    if (layer) {
                      map.setLayoutProperty(
                        '3d-buildings',
                        'visibility',
                        e.target.checked ? 'visible' : 'none'
                      );
                    }
                  }
                }}
                className="w-4 h-4"
              />
              <span className="text-gray-700 font-medium">{t.buildings}</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
