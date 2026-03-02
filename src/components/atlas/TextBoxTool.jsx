import React, { useState } from "react";
import { MessageSquare, X, Save, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TextBoxTool = React.forwardRef(({ 
  isOpen, 
  onClose, 
  isTextBoxMode, 
  setIsTextBoxMode, 
  language,
  onSaveTextBox,
  selectedCoords,
  scale = 1.0
}, ref) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const translations = {
    tr: {
      title: "Metin Kutusu Ekle",
      description: "Haritaya konumlandırılmış metin kutusu ekleyin",
      activate: "Konum Seç",
      deactivate: "İptal",
      titlePlaceholder: "Başlık",
      contentPlaceholder: "Metin içeriğinizi buraya yazın...",
      save: "Kaydet",
      clickMap: "Haritaya tıklayarak konum seçin",
      locationSelected: "Konum seçildi",
    },
    en: {
      title: "Add Text Box",
      description: "Add a geolocated text box to the map",
      activate: "Select Location",
      deactivate: "Cancel",
      titlePlaceholder: "Title",
      contentPlaceholder: "Write your text content here...",
      save: "Save",
      clickMap: "Click on the map to select location",
      locationSelected: "Location selected",
    }
  };

  const t = translations[language];

  const handleActivateMode = () => {
    setIsTextBoxMode(true);
  };

  const handleDeactivateMode = () => {
    setIsTextBoxMode(false);
  };

  const handleSave = () => {
    if (selectedCoords && (title || content)) {
      onSaveTextBox({
        id: Date.now().toString(),
        title: title || "Untitled",
        content,
        coords: selectedCoords,
        timestamp: new Date().toISOString(),
      });
      
      // Reset form
      setTitle("");
      setContent("");
      setIsTextBoxMode(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-[500px] bg-gray-900 text-white border-gray-700"
        style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-400" />
            {t.title}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {t.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Location Selection */}
          <div className="space-y-2">
            {!isTextBoxMode ? (
              <Button
                onClick={handleActivateMode}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {t.activate}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleDeactivateMode}
                  variant="outline"
                  className="w-full border-gray-600 text-white hover:bg-gray-800"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t.deactivate}
                </Button>
                {!selectedCoords && (
                  <p className="text-sm text-yellow-400 text-center animate-pulse">
                    {t.clickMap}
                  </p>
                )}
                {selectedCoords && (
                  <div className="flex items-center justify-center gap-2 text-sm text-green-400">
                    <MapPin className="w-4 h-4" />
                    <span>{t.locationSelected}</span>
                    <span className="text-gray-400">
                      ({selectedCoords.lat.toFixed(5)}, {selectedCoords.lng.toFixed(5)})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Input
              type="text"
              placeholder={t.titlePlaceholder}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              disabled={!selectedCoords}
            />
          </div>

          {/* Content Textarea */}
          <div className="space-y-2">
            <Textarea
              placeholder={t.contentPlaceholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[150px]"
              disabled={!selectedCoords}
            />
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={!selectedCoords || (!title && !content)}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {t.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

TextBoxTool.displayName = 'TextBoxTool';

export default TextBoxTool;
