import React from "react";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import { motion } from "framer-motion";

export default function LanguageToggle({ language, setLanguage }) {
  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="flex items-center gap-2 mr-6"
    >
      <Languages className="w-5 h-5 text-white" />
      <div className="bg-white/20 backdrop-blur-sm rounded-lg p-1">
        <Button
          variant={language === 'tr' ? 'default' : 'ghost'}
          size="sm"
          className={`text-xs px-3 py-1 rounded transition-all ${
            language === 'tr' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-white hover:bg-white/20'
          }`}
          onClick={() => setLanguage('tr')}
        >
          TR
        </Button>
        <Button
          variant={language === 'en' ? 'default' : 'ghost'}
          size="sm"
          className={`text-xs px-3 py-1 rounded transition-all ${
            language === 'en' 
              ? 'bg-white text-gray-900 shadow-sm' 
              : 'text-white hover:bg-white/20'
          }`}
          onClick={() => setLanguage('en')}
        >
          EN
        </Button>
      </div>
    </motion.div>
  );
}