import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, MessageSquare, Save, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TextBox, generateSequentialId } from "@/api/entities";

export default function TextBoxPanel({
  isOpen,
  onClose,
  language,
  isLocationMode,
  setIsLocationMode,
  coords,
  onSaveTextBox,
  scale = 1.0
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);

  useEffect(() => {
    if (coords) {
      setSelectedCoords(coords);
    }
  }, [coords]);

  const translations = {
    tr: {
      title: "Metin Kutusu Ekle",
      subtitle: "Haritaya konumlandırılmış metin notu ekleyin",
      titleField: "Başlık",
      titlePlaceholder: "Metin kutusuna bir başlık verin",
      content: "İçerik",
      contentPlaceholder: "Metin içeriğinizi buraya yazın...",
      location: "Konum",
      selectOnMap: "Haritadan Konum Seç",
      selecting: "Haritaya tıklayın...",
      locationSelected: "Konum Seçildi",
      save: "Kaydet",
      coordinates: "Koordinatlar"
    },
    en: {
      title: "Add Text Box",
      subtitle: "Add a geolocated text note to the map",
      titleField: "Title",
      titlePlaceholder: "Give your text box a title",
      content: "Content",
      contentPlaceholder: "Write your text content here...",
      location: "Location",
      selectOnMap: "Select Location from Map",
      selecting: "Click on the map...",
      locationSelected: "Location Selected",
      save: "Save",
      coordinates: "Coordinates"
    }
  };

  const t = translations[language];

  const handleSave = async () => {
    if (selectedCoords && (title || content)) {
      try {
        console.log('🔵 Starting textbox save...');
        console.log('📍 Coords:', selectedCoords);
        console.log('📝 Title:', title);
        console.log('📝 Content:', content);
        
        // Generate sequential ID
        console.log('🔢 Generating sequential ID...');
        const textBoxId = await generateSequentialId(TextBox, 'TXT');
        console.log('✅ Generated ID:', textBoxId);
        
        // Prepare data object
        const textBoxData = {
          textBoxId,
          title: title || 'Untitled',
          content: content || title,
          contributor_name: 'Anonymous',
          coords: {
            lat: selectedCoords.lat,
            lng: selectedCoords.lng
          },
          style: {
            fontSize: '14px',
            color: '#000000',
            backgroundColor: '#ffffff',
            fontWeight: 'normal',
            fontFamily: 'Arial, sans-serif'
          },
          status: 'pending',
          rejection_reason: '',
          created_date: new Date(),
          approved_date: null,
          approved_by: null,
          view_count: 0,
          language: language
        };
        
        console.log('💾 Saving to database with data:', textBoxData);
        
        // Save to database
        const savedTextBox = await TextBox.create(textBoxData);
        
        console.log('✅ TextBox saved successfully!');
        console.log('📦 Saved data:', savedTextBox);
        
        // Call parent callback with the saved textbox (including database ID)
        onSaveTextBox({
          id: savedTextBox._id,
          textBoxId,
          title: title || "Untitled",
          content,
          coords: selectedCoords,
          timestamp: new Date().toISOString(),
        });
        
        // Reset form
        setTitle('');
        setContent('');
        setSelectedCoords(null);
        setIsLocationMode(false);
        onClose();
      } catch (error) {
        console.error('❌ Error saving text box:', error);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        if (error.response) {
          console.error('❌ Server response:', error.response);
        }
        alert(`Error saving text box: ${error.message || 'Unknown error'}. Check console for details.`);
      }
    } else {
      console.warn('⚠️ Cannot save: Missing coords or content');
      console.log('selectedCoords:', selectedCoords);
      console.log('title:', title);
      console.log('content:', content);
      alert('Please select a location and add some text before saving.');
    }
  };

  const handleLocationClick = () => {
    setIsLocationMode(!isLocationMode);
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
          className="absolute right-12 top-24 bottom-20 w-96 z-[1100]"
        >
          <Card className="h-full bg-white/70 backdrop-blur-lg shadow-2xl border border-white/20 flex flex-col">
            <CardHeader className="border-b border-white/10 bg-cyan-600/80 backdrop-blur-lg text-white rounded-t-lg flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {t.title}
                  </CardTitle>
                  <p className="text-cyan-100 text-sm mt-1">{t.subtitle}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsLocationMode(false);
                    onClose();
                  }}
                  className="text-white hover:bg-white/20 mt-[-2px] mr-[-2px]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Location Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t.location}
                </label>
                <Button
                  type="button"
                  onClick={handleLocationClick}
                  variant={isLocationMode ? "default" : "outline"}
                  className={`w-full ${
                    isLocationMode 
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                      : 'border-gray-300'
                  }`}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {isLocationMode ? t.selecting : t.selectOnMap}
                </Button>
                
                {selectedCoords && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {t.locationSelected}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {t.coordinates}: {selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)}
                    </p>
                  </div>
                )}
              </div>

              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t.titleField}
                </label>
                <Input
                  type="text"
                  placeholder={t.titlePlaceholder}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={!selectedCoords}
                  className="border-gray-300"
                />
              </div>

              {/* Content Textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  {t.content}
                </label>
                <Textarea
                  placeholder={t.contentPlaceholder}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={!selectedCoords}
                  className="border-gray-300 min-h-[200px] resize-none"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={!selectedCoords || (!title && !content)}
                className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {t.save}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
