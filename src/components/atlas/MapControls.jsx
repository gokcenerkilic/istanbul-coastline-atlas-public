import React from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Edit3, Camera, Layers, Upload, Search, MessageSquare, Box, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function MapControls({ 
  activePanel, 
  setActivePanel,
  onContributeClick,
  isDrawingMode, 
  setIsDrawingMode,
  language,
  is3DView,
  setIs3DView,
  onAdminClick
}) {
  const translations = {
    tr: {
      contribute: "Katkı",
      draw: "Çizim",
      media: "Medya",
      layers: "Katmanlar",
      upload: "Yükleme",
      search: "Arama",
      textBox: "Metin Kutusu",
      view3D: "3D Görünüm",
      admin: "Yönetim"
    },
    en: {
      contribute: "Contribute",
      draw: "Draw",
      media: "Media",
      layers: "Layers",
      upload: "Upload",
      search: "Search",
      textBox: "Text Box",
      view3D: "3D View",
      admin: "Admin"
    }
  };

  const t = translations[language];

  const controls = [
    { id: 'contribute', icon: MapPin, label: t.contribute, color: 'bg-blue-600 hover:bg-blue-700' },
    { id: 'draw', icon: Edit3, label: t.draw, color: 'bg-green-600 hover:bg-green-700' },
    { id: 'textbox', icon: MessageSquare, label: t.textBox, color: 'bg-cyan-600 hover:bg-cyan-700' },
    { id: 'layers', icon: Layers, label: t.layers, color: 'bg-orange-600 hover:bg-orange-700' },
    { id: 'upload', icon: Upload, label: t.upload, color: 'bg-purple-600 hover:bg-purple-700' },
    { id: 'search', icon: Search, label: t.search, color: 'bg-gray-600 hover:bg-gray-700' },
  ];

  const handleControlClick = (id) => {
    if (id === 'contribute') {
      onContributeClick();
    } else {
      setActivePanel(activePanel === id ? null : id);
    }
  };

  return (
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="absolute left-6 top-[40%] transform -translate-y-1/2 z-40"
    >
      <div className="bg-white/60 backdrop-blur-lg rounded-xl p-2 shadow-2xl border border-white/30">
        <div className="flex flex-col gap-2">
          {controls.map((control) => (
            <Button
              key={control.id}
              variant={activePanel === control.id ? "default" : "ghost"}
              size="lg"
              className={`w-14 h-14 rounded-xl transition-all duration-200 ${
                activePanel === control.id 
                  ? control.color + ' text-white shadow-lg scale-105' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => handleControlClick(control.id)}
              title={control.label}
            >
              <control.icon className="w-6 h-6" />
            </Button>
          ))}
          
          {/* 3D View Toggle Button - Integrated */}
          <Button
            variant="ghost"
            size="lg"
            className={`w-14 h-14 rounded-xl transition-all duration-200 ${
              is3DView 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg scale-105' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => setIs3DView(!is3DView)}
            title={t.view3D}
          >
            <Box className="w-6 h-6" />
          </Button>
          
          {/* Admin Button */}
          {onAdminClick && (
            <Button
              variant="ghost"
              size="lg"
              className="w-14 h-14 rounded-xl transition-all duration-200 text-gray-700 hover:bg-red-50 hover:text-red-600"
              onClick={onAdminClick}
              title={t.admin}
            >
              <Shield className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}