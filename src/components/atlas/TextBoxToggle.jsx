import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TextBoxToggle({ 
  showTextBoxes, 
  setShowTextBoxes, 
  textBoxCount,
  language 
}) {
  const translations = {
    tr: {
      show: "Metin Kutularını Göster",
      hide: "Metin Kutularını Gizle",
      count: "metin kutusu"
    },
    en: {
      show: "Show Text Boxes",
      hide: "Hide Text Boxes",
      count: "text boxes"
    }
  };

  const t = translations[language];

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="absolute bottom-20 right-6 z-40"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        <Button
          onClick={() => setShowTextBoxes(!showTextBoxes)}
          className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
            showTextBoxes 
              ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
          title={showTextBoxes ? t.hide : t.show}
        >
          <MessageSquare className="w-5 h-5" />
          
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              {showTextBoxes ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {showTextBoxes ? t.hide : t.show}
              </span>
            </div>
            
            <AnimatePresence>
              {textBoxCount > 0 && (
                <motion.span 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-xs opacity-80"
                >
                  {textBoxCount} {t.count}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Button>
      </div>
    </motion.div>
  );
}
