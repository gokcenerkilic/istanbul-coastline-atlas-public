import React, { useEffect, useState, useCallback } from 'react';
import { useMap, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';

export default function DrawingCanvas({ 
  isDrawingMode, 
  onDrawingComplete, 
  drawingStyle,
  completedPaths = [],
  onPathsUpdate
}) {
  const [currentPath, setCurrentPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tempPaths, setTempPaths] = useState([]);
  const map = useMap();

  // Handle map events for drawing
  useMapEvents({
    mousedown(e) {
      if (isDrawingMode && !isDrawing) {
        e.originalEvent.preventDefault();
        setIsDrawing(true);
        setCurrentPath([e.latlng]);
      }
    },
    mousemove(e) {
      if (isDrawingMode && isDrawing) {
        e.originalEvent.preventDefault();
        setCurrentPath(prev => [...prev, e.latlng]);
      }
    },
    mouseup(e) {
      if (isDrawingMode && isDrawing) {
        e.originalEvent.preventDefault();
        setIsDrawing(false);
        
        if (currentPath.length > 1) {
          const finalPath = [...currentPath, e.latlng];
          const newCompletedPath = {
            coordinates: finalPath,
            style: { ...drawingStyle }
          };
          
          // Add to temporary paths for immediate display
          setTempPaths(prev => [...prev, newCompletedPath]);
          
          // Notify parent component
          if (onDrawingComplete) {
            onDrawingComplete(finalPath);
          }
          
          // Update parent with all paths
          if (onPathsUpdate) {
            onPathsUpdate([...tempPaths, newCompletedPath]);
          }
        }
        
        // Clear current path but stay in drawing mode
        setCurrentPath([]);
      }
    },
    // Prevent default map interactions during drawing
    click(e) {
      if (isDrawingMode) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
    }
  });

  // Reset paths when drawing mode is disabled
  useEffect(() => {
    if (!isDrawingMode) {
      setCurrentPath([]);
      setIsDrawing(false);
      setTempPaths([]);
    }
  }, [isDrawingMode]);

  // Change cursor and disable interactions when in drawing mode
  useEffect(() => {
    if (isDrawingMode) {
      map.getContainer().style.cursor = 'crosshair';
      // Disable default map interactions while drawing
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      
      // Disable click events on the map
      map.off('click');
    } else {
      map.getContainer().style.cursor = '';
      // Re-enable map interactions
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    }

    return () => {
      // Cleanup - ensure interactions are re-enabled
      map.getContainer().style.cursor = '';
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
    };
  }, [isDrawingMode, map]);

  // Clear temporary paths when requested
  useEffect(() => {
    if (completedPaths.length === 0) {
      setTempPaths([]);
    }
  }, [completedPaths]);

  return (
    <>
      {/* Current drawing path (while actively drawing) */}
      {currentPath.length > 1 && (
        <Polyline
          positions={currentPath}
          pathOptions={{
            color: drawingStyle.color,
            weight: drawingStyle.weight,
            opacity: drawingStyle.opacity * 0.7,
            dashArray: '5, 5' // Dashed line for current drawing
          }}
        />
      )}
      
      {/* Completed paths in current session */}
      {tempPaths.map((pathData, index) => (
        <Polyline
          key={`temp-${index}`}
          positions={pathData.coordinates}
          pathOptions={{
            color: pathData.style.color,
            weight: pathData.style.weight,
            opacity: pathData.style.opacity
          }}
        />
      ))}
    </>
  );
}