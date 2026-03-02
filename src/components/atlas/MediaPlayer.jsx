import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Volume2, Image, Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";

export default function MediaPlayer({ media, onClose, language }) {
  if (!media) return null;

  const translations = {
    tr: {
      workshopMedia: "Atölye Medyası",
      date: "Tarih",
      location: "Konum",
      tags: "Etiketler"
    },
    en: {
      workshopMedia: "Workshop Media",
      date: "Date",
      location: "Location",
      tags: "Tags"
    }
  };

  const t = translations[language];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-full max-w-2xl bg-white shadow-2xl">
            <CardHeader className="border-b bg-purple-600 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  {media.media_type === 'audio' ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <Image className="w-5 h-5" />
                  )}
                  {t.workshopMedia}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{media.title}</h2>
              
              {media.description && (
                <p className="text-gray-600 mb-4">{media.description}</p>
              )}

              {/* Media Content */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                {media.media_type === 'audio' ? (
                  <audio
                    controls
                    className="w-full"
                    src={media.file_url}
                  >
                    Your browser does not support the audio element.
                  </audio>
                ) : media.media_type === 'image' ? (
                  <img
                    src={media.file_url}
                    alt={media.title}
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Media type not supported for preview</p>
                    <a
                      href={media.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Open in new tab
                    </a>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="space-y-3 text-sm">
                {media.workshop_date && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{t.date}: {format(new Date(media.workshop_date), 'dd.MM.yyyy')}</span>
                  </div>
                )}
                
                {media.location_name && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{t.location}: {media.location_name}</span>
                  </div>
                )}

                {media.tags && media.tags.length > 0 && (
                  <div className="flex items-start gap-2 text-gray-600">
                    <span>{t.tags}:</span>
                    <div className="flex flex-wrap gap-1">
                      {media.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}