
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Edit3, Palette, Save, Trash2, Play, Square, MousePointer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Drawing } from "@/api/entities";

export default function DrawingTools({ 
  isOpen, 
  onClose, 
  isDrawingMode, 
  setIsDrawingMode, 
  language,
  onDrawingComplete,
  onClearDrawings,
  drawnPaths = [], // Paths drawn on map from parent
  onStopDrawing, // Callback to finish current drawing
  scale
}) {
  const [drawingData, setDrawingData] = useState({
    name: '',
    description: '',
    contributor_name: '',
    category: 'coastline',
    style: {
      color: '#ff6b6b',
      weight: 3,
      opacity: 0.8
    }
  });
  const [allPaths, setAllPaths] = useState([]);

  // Update allPaths when drawnPaths changes (paths drawn on map)
  useEffect(() => {
    console.log('🔍 DrawingTools useEffect - drawnPaths:', drawnPaths?.length, 'isDrawingMode:', isDrawingMode);
    if (drawnPaths && drawnPaths.length > 0) {
      console.log('📍 Received drawn paths from map:', drawnPaths.length);
      const formattedPaths = drawnPaths.map(pathCoords => ({
        coordinates: pathCoords.map(coord => [coord.lat, coord.lng]),
        style: { ...drawingData.style }
      }));
      setAllPaths(formattedPaths);
      console.log('✅ allPaths updated, length:', formattedPaths.length);
    }
  }, [drawnPaths, drawingData.style]);

  // Log when form should appear
  useEffect(() => {
    console.log('📝 Form visibility check - isDrawingMode:', isDrawingMode, 'allPaths.length:', allPaths.length);
    if (!isDrawingMode && allPaths.length > 0) {
      console.log('✅ Form should be visible now!');
    }
  }, [isDrawingMode, allPaths]);
  const [isSaving, setIsSaving] = useState(false);

  // Close panel and always exit drawing mode if active
  const handleClose = () => {
    if (isDrawingMode) {
      setIsDrawingMode(false);
    }
    onClose();
  };

  const translations = {
    tr: {
      title: "Çizim Araçları",
      subtitle: "Harita üzerinde çizim yapın",
      name: "Çizim Adı",
      description: "Açıklama",
      contributor: "Adınız",
      category: "Kategori",
      color: "Renk",
      thickness: "Kalınlık",
      opacity: "Şeffaflık",
      save: "Kaydet",
      clear: "Temizle",
      startDrawing: "Çizime Başla",
      stopDrawing: "Çizimi Bitir",
      drawingActive: "Çizim Modu Aktif",
      drawingInstructions: "Harita üzerinde tıklayarak noktalar ekleyin. Çift tıklama veya Enter ile bitirin.",
      pathsDrawn: "çizgi çizildi",
      categories: {
        coastline: "Kıyı Çizgisi",
        infrastructure: "Altyapı",
        erosion: "Erozyon",
        development: "Gelişim",
        other: "Diğer"
      }
    },
    en: {
      title: "Drawing Tools",
      subtitle: "Draw on the map",
      name: "Drawing Name",
      description: "Description",
      contributor: "Your Name",
      category: "Category",
      color: "Color",
      thickness: "Thickness",
      opacity: "Opacity",
      save: "Save",
      clear: "Clear",
      startDrawing: "Start Drawing",
      stopDrawing: "Stop Drawing",
      drawingActive: "Drawing Mode Active",
      drawingInstructions: "Click on the map to add points. Double-click or press Enter to finish.",
      pathsDrawn: "lines drawn",
      categories: {
        coastline: "Coastline",
        infrastructure: "Infrastructure",
        erosion: "Erosion",
        development: "Development",
        other: "Other"
      }
    }
  };

  const t = translations[language];

  const colors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
  ];

  const handleDrawingComplete = (pathCoordinates) => {
    console.log('✏️ Path completed, adding to local paths:', pathCoordinates.length, 'points');
    const newPath = {
      coordinates: pathCoordinates.map(latlng => [latlng.lat, latlng.lng]),
      style: { ...drawingData.style }
    };
    setAllPaths(prev => [...prev, newPath]);
    // Stop drawing mode after completing the geometry
    setIsDrawingMode(false);
    // Note: Don't call onDrawingComplete here - that's only for the Save button
  };

  const handlePathsUpdate = (updatedPaths) => {
    setAllPaths(updatedPaths);
  };

  const handleStartDrawing = () => {
    setIsDrawingMode(true);
  };

  const handleStopDrawing = () => {
    console.log('🛑 Stop Drawing button clicked');
    // Call parent to finish the current drawing
    if (onStopDrawing) {
      onStopDrawing();
    }
    setIsDrawingMode(false);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!drawingData.name.trim()) {
      alert(language === 'tr' ? 'Lütfen çizim için bir ad girin' : 'Please enter a name for the drawing');
      return;
    }

    if (!drawingData.contributor_name.trim()) {
      alert(language === 'tr' ? 'Lütfen adınızı girin' : 'Please enter your name');
      return;
    }

    if (allPaths.length === 0) {
      alert(language === 'tr' ? 'Lütfen önce bir şeyler çizin' : 'Please draw something first');
      return;
    }

    setIsSaving(true);
    try {
      // Combine all paths into one polygon/line
      const combinedCoordinates = allPaths.flatMap(path => path.coordinates);
      
      console.log('💾 Saving drawing with data:', {
        name: drawingData.name,
        description: drawingData.description,
        contributor_name: drawingData.contributor_name,
        category: drawingData.category,
        coordinates: combinedCoordinates.length,
        style: drawingData.style
      });
      
      // Call parent callback with drawing data and coordinates
      if (onDrawingComplete) {
        await onDrawingComplete(drawingData, combinedCoordinates);
      }
      
      // Reset form and drawings after successful save
      setDrawingData({
        name: '',
        description: '',
        contributor_name: '',
        category: 'coastline',
        style: {
          color: '#ff6b6b',
          weight: 3,
          opacity: 0.8
        }
      });
      setAllPaths([]);
      setIsDrawingMode(false);
    } catch (error) {
      console.error('❌ Error in handleSave:', error);
      alert(language === 'tr' ? 'Çizim kaydedilirken hata oluştu' : 'Error saving drawing');
    }
    setIsSaving(false);
  };

  const handleClear = () => {
    setAllPaths([]);
    if (onClearDrawings) {
      onClearDrawings();
    }
  };

  const handleClearAndRestart = () => {
    // Clear all paths
    setAllPaths([]);
    if (onClearDrawings) {
      onClearDrawings();
    }
    // Reset form
    setDrawingData({
      name: '',
      description: '',
      contributor_name: '',
      category: 'coastline',
      style: {
        color: '#ff6b6b',
        weight: 3,
        opacity: 0.8
      }
    });
    // Start drawing mode again
    setIsDrawingMode(true);
  };

  // Update style for existing paths when user changes style
  const handleStyleChange = (styleUpdate) => {
    const newStyle = { ...drawingData.style, ...styleUpdate };
    setDrawingData({ ...drawingData, style: newStyle });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          style={{ transform: `scale(${scale})`, transformOrigin: 'top right' }}
          className="absolute right-12 top-24 bottom-20 w-80 z-[1100]"
        >
          <Card className="h-full bg-white/70 backdrop-blur-lg shadow-2xl border border-white/20">
            <CardHeader className="relative border-b border-white/10 bg-green-600/80 backdrop-blur-lg text-white rounded-t-lg">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  {t.title}
                  {isDrawingMode && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded ml-2">
                      ✏️ Aktif
                    </span>
                  )}
                </CardTitle>
                <p className="text-green-100 text-sm mt-1">{t.subtitle}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute top-[6px] right-[6px] text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>

            <CardContent className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* Drawing Control */}
                <div className="flex gap-2">
                  {!isDrawingMode ? (
                    <Button
                      onClick={handleStartDrawing}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {t.startDrawing}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStopDrawing}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      {t.stopDrawing}
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleClear}
                    disabled={allPaths.length === 0}
                    title={t.clear}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Clear & Restart Button - Show after drawing is complete */}
                {!isDrawingMode && allPaths.length > 0 && (
                  <Button
                    onClick={handleClearAndRestart}
                    variant="outline"
                    className="w-full border-orange-500 text-orange-600 hover:bg-orange-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {language === 'tr' ? 'Çizimi Sil ve Yeniden Başla' : 'Clear & Restart Drawing'}
                  </Button>
                )}

                {/* Drawing Status */}
                {isDrawingMode && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-green-800 font-medium">
                      <MousePointer className="w-4 h-4 animate-pulse" />
                      {t.drawingActive}
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      {t.drawingInstructions}
                    </p>
                  </div>
                )}

                {/* Drawing Complete - Ready to Fill Form */}
                {!isDrawingMode && allPaths.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm text-blue-800 font-medium">
                      ✅ Drawing Complete!
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      <strong>{allPaths.length}</strong> {t.pathsDrawn} - {language === 'tr' ? 'Şimdi formu doldurun ve kaydedin' : 'Now fill the form and save'}
                    </p>
                  </div>
                )}

                {/* Form fields - only show after drawing is complete */}
                {!isDrawingMode && allPaths.length > 0 && (
                  <>
                <div>
                  <Input
                    placeholder={t.name}
                    value={drawingData.name}
                    onChange={(e) => setDrawingData({...drawingData, name: e.target.value})}
                    className="border-gray-200"
                  />
                </div>

                <div>
                  <Textarea
                    placeholder={t.description}
                    value={drawingData.description}
                    onChange={(e) => setDrawingData({...drawingData, description: e.target.value})}
                    rows={3}
                    className="border-gray-200"
                  />
                </div>

                <div>
                  <Input
                    placeholder={t.contributor}
                    value={drawingData.contributor_name}
                    onChange={(e) => setDrawingData({...drawingData, contributor_name: e.target.value})}
                    className="border-gray-200"
                  />
                </div>

                <div>
                  <Select
                    value={drawingData.category}
                    onValueChange={(value) => setDrawingData({...drawingData, category: value})}
                  >
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder={t.category} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(t.categories).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Style Controls */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium">{t.color}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        className={`w-8 h-8 rounded border-2 transition-all ${
                          drawingData.style.color === color ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleStyleChange({ color })}
                      />
                    ))}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      {t.thickness}: {drawingData.style.weight}px
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={drawingData.style.weight}
                      onChange={(e) => handleStyleChange({ weight: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      {t.opacity}: {Math.round(drawingData.style.opacity * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={drawingData.style.opacity}
                      onChange={(e) => handleStyleChange({ opacity: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={isSaving || !drawingData.name.trim() || !drawingData.contributor_name.trim() || allPaths.length === 0}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? (language === 'tr' ? 'Kaydediliyor...' : 'Saving...') : t.save}
                </Button>
                </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
