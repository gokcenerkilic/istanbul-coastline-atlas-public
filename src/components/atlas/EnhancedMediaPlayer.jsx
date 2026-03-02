
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Volume2, Image, Calendar, MapPin, Play, Pause, SkipBack, SkipForward, VolumeX } from "lucide-react";
import { format } from "date-fns";

export default function EnhancedMediaPlayer({ media, onClose, language, scale }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  const translations = {
    tr: {
      workshopMedia: "Atölye Medyası",
      date: "Tarih",
      location: "Konum",
      tags: "Etiketler",
      facilitators: "Moderatörler",
      workshop: "Atölye",
      transcript: "Transkript"
    },
    en: {
      workshopMedia: "Workshop Media",
      date: "Date",
      location: "Location",
      tags: "Tags",
      facilitators: "Facilitators",
      workshop: "Workshop", 
      transcript: "Transcript"
    }
  };

  const t = translations[language];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  if (!media) return null;

  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const skip = (seconds) => {
    const audio = audioRef.current;
    audio.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

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
          style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
          className="w-full max-w-2xl"
        >
          <Card className="bg-white shadow-2xl">
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
              <div className="mb-6">
                {media.media_type === 'audio' ? (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <audio
                      ref={audioRef}
                      src={media.file_url}
                      preload="metadata"
                      className="hidden"
                    />
                    
                    {/* Audio Controls */}
                    <div className="space-y-4">
                      {/* Progress Bar */}
                      <div 
                        className="w-full h-2 bg-gray-200 rounded-full cursor-pointer overflow-hidden"
                        onClick={handleSeek}
                      >
                        <div 
                          className="h-full bg-purple-600 transition-all duration-100"
                          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>

                      {/* Time Display */}
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => skip(-10)}
                          disabled={!duration}
                        >
                          <SkipBack className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="lg"
                          onClick={handlePlayPause}
                          className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-700"
                          disabled={!duration}
                        >
                          {isPlaying ? (
                            <Pause className="w-6 h-6" />
                          ) : (
                            <Play className="w-6 h-6 ml-0.5" />
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => skip(10)}
                          disabled={!duration}
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Volume Control */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={toggleMute}
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </Button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="flex-1 h-1"
                        />
                      </div>
                    </div>
                  </div>
                ) : media.media_type === 'image' ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <img
                      src={media.file_url}
                      alt={media.title}
                      className="w-full h-auto rounded-lg max-h-96 object-contain mx-auto"
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Media type not supported for preview</p>
                    <a
                      href={media.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      Open in new tab
                    </a>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                  <div className="md:col-span-2">
                    <span className="text-gray-600">{t.tags}: </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {media.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs"
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
