import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Layers, Satellite, Map } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LayerControlPanel({ isOpen, onClose, language, activeLayer, setActiveLayer, scale }) {
  const translations = {
    tr: {
      title: "Katmanlar",
      subtitle: "Harita görünümünü değiştirin",
      satellite: "Uydu",
      custom_atlas: "Kıyı Çizgisi Atlası"
    },
    en: {
      title: "Layers",
      subtitle: "Change the map view",
      satellite: "Satellite",
      custom_atlas: "Coastline Atlas"
    }
  };

  const t = translations[language];

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
            <CardHeader className="border-b border-white/10 bg-orange-600/80 backdrop-blur-lg text-white rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    {t.title}
                  </CardTitle>
                  <p className="text-orange-100 text-sm mt-1">{t.subtitle}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20 mt-[-2px] mr-[-2px]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Base Layer Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Base Map</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveLayer('custom_atlas')}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${activeLayer === 'custom_atlas' ? 'border-orange-500' : 'border-transparent hover:border-orange-300'}`}
                  >
                    <Map className="w-full h-24 text-gray-400 p-4" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-center text-white text-sm font-medium">
                      {t.custom_atlas}
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveLayer('satellite')}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all ${activeLayer === 'satellite' ? 'border-orange-500' : 'border-transparent hover:border-orange-300'}`}
                  >
                    <Satellite className="w-full h-24 text-gray-400 p-4" />
                     <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-center text-white text-sm font-medium">
                      {t.satellite}
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}