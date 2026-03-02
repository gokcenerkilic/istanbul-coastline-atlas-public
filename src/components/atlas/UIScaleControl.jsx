import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Monitor } from 'lucide-react';

export default function UIScaleControl({ scale, setScale, language }) {
  const translations = {
    tr: {
      uiScale: "Arayüz Ölçeği"
    },
    en: {
      uiScale: "UI Scale"
    }
  };
  const t = translations[language];

  const scaleOptions = [0.8, 0.9, 1.0, 1.1, 1.2];

  const increaseScale = () => {
    const currentIndex = scaleOptions.indexOf(scale);
    if (currentIndex < scaleOptions.length - 1) {
      setScale(scaleOptions[currentIndex + 1]);
    }
  };

  const decreaseScale = () => {
    const currentIndex = scaleOptions.indexOf(scale);
    if (currentIndex > 0) {
      setScale(scaleOptions[currentIndex - 1]);
    }
  };

  return (
    <div className="absolute bottom-[22px] right-4 z-50 bg-black/60 backdrop-blur-sm rounded-lg p-2 text-white text-xs flex items-center gap-2">
      <Monitor className="w-4 h-4" />
      <span className="font-semibold">{t.uiScale}:</span>
      <Button variant="ghost" size="icon" className="w-6 h-6 text-white hover:bg-white/20" onClick={decreaseScale} disabled={scale <= 0.8}>
        <ZoomOut className="w-4 h-4" />
      </Button>
      <span className="w-10 text-center font-bold">{Math.round(scale * 100)}%</span>
      <Button variant="ghost" size="icon" className="w-6 h-6 text-white hover:bg-white/20" onClick={increaseScale} disabled={scale >= 1.2}>
        <ZoomIn className="w-4 h-4" />
      </Button>
    </div>
  );
}