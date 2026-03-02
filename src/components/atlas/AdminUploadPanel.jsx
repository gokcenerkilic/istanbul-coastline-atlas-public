
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Upload, FileAudio, Image, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadFile } from "@/api/integrations";
import { WorkshopMedia } from "@/api/entities";

export default function AdminUploadPanel({ isOpen, onClose, language, scale }) {
  const [uploadType, setUploadType] = useState('single');
  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState({
    workshop_name: '',
    workshop_date: '',
    facilitators: '',
    location_name: '',
    latitude: '',
    longitude: '',
    tags: '',
    description: '',
    language: language
  });
  const [uploading, setUploading] = useState(false);

  const translations = {
    tr: {
      title: "Atölye Medya Yükleme",
      subtitle: "Toplu medya yükleme ve metadata yönetimi",
      singleUpload: "Tekil Yükleme",
      bulkUpload: "Toplu Yükleme",
      workshopName: "Atölye Adı",
      workshopDate: "Atölye Tarihi",
      facilitators: "Moderatörler",
      location: "Konum",
      latitude: "Enlem",
      longitude: "Boylam",
      tags: "Etiketler (virgülle ayırın)",
      description: "Açıklama",
      selectFiles: "Dosyalar Seç",
      supportedFormats: "Desteklenen formatlar: JPG, PNG, MP3, WAV (max 50MB)",
      upload: "Yükle",
      uploading: "Yükleniyor..."
    },
    en: {
      title: "Workshop Media Upload",
      subtitle: "Bulk media upload and metadata management",
      singleUpload: "Single Upload",
      bulkUpload: "Bulk Upload",
      workshopName: "Workshop Name",
      workshopDate: "Workshop Date",
      facilitators: "Facilitators",
      location: "Location",
      latitude: "Latitude",
      longitude: "Longitude",
      tags: "Tags (comma separated)",
      description: "Description",
      selectFiles: "Select Files",
      supportedFormats: "Supported formats: JPG, PNG, MP3, WAV (max 50MB)",
      upload: "Upload",
      uploading: "Uploading..."
    }
  };

  const t = translations[language];

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert(language === 'tr' ? 'Lütfen dosya seçin' : 'Please select files');
      return;
    }

    setUploading(true);
    
    try {
      for (const file of files) {
        // Upload file
        const { file_url } = await UploadFile({ file });
        
        // Determine media type
        const mediaType = file.type.startsWith('image/') ? 'image' : 'audio';
        
        // Create workshop media record
        await WorkshopMedia.create({
          title: file.name.split('.')[0],
          description: metadata.description,
          media_type: mediaType,
          file_url: file_url,
          latitude: metadata.latitude ? parseFloat(metadata.latitude) : null,
          longitude: metadata.longitude ? parseFloat(metadata.longitude) : null,
          workshop_date: metadata.workshop_date,
          location_name: metadata.location_name,
          language: metadata.language,
          tags: metadata.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        });
      }
      
      alert(language === 'tr' ? 'Dosyalar başarıyla yüklendi!' : 'Files uploaded successfully!');
      setFiles([]);
      setMetadata({
        workshop_name: '',
        workshop_date: '',
        facilitators: '',
        location_name: '',
        latitude: '',
        longitude: '',
        tags: '',
        description: '',
        language: language
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert(language === 'tr' ? 'Yükleme hatası' : 'Upload error');
    }
    
    setUploading(false);
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
          <Card className="h-full bg-white/70 backdrop-blur-lg shadow-2xl border border-white/20">
            <CardHeader className="border-b border-white/10 bg-purple-600/80 backdrop-blur-lg text-white rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    {t.title}
                  </CardTitle>
                  <p className="text-purple-100 text-sm mt-1">{t.subtitle}</p>
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

            <CardContent className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* File Upload */}
                <div>
                  <Input
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.mp3,.wav"
                    onChange={handleFileSelect}
                    className="mb-2"
                  />
                  <p className="text-xs text-gray-500">{t.supportedFormats}</p>
                  
                  {files.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {Array.from(files).map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                          {file.type.startsWith('image/') ? (
                            <Image className="w-4 h-4 text-blue-500" />
                          ) : (
                            <FileAudio className="w-4 h-4 text-green-500" />
                          )}
                          <span className="truncate">{file.name}</span>
                          <span className="text-gray-500">({(file.size / 1024 / 1024).toFixed(1)}MB)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Metadata Form */}
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder={t.workshopName}
                    value={metadata.workshop_name}
                    onChange={(e) => setMetadata({...metadata, workshop_name: e.target.value})}
                  />
                  <Input
                    type="date"
                    placeholder={t.workshopDate}
                    value={metadata.workshop_date}
                    onChange={(e) => setMetadata({...metadata, workshop_date: e.target.value})}
                  />
                </div>

                <Input
                  placeholder={t.facilitators}
                  value={metadata.facilitators}
                  onChange={(e) => setMetadata({...metadata, facilitators: e.target.value})}
                />

                <Input
                  placeholder={t.location}
                  value={metadata.location_name}
                  onChange={(e) => setMetadata({...metadata, location_name: e.target.value})}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    step="any"
                    placeholder={t.latitude}
                    value={metadata.latitude}
                    onChange={(e) => setMetadata({...metadata, latitude: e.target.value})}
                  />
                  <Input
                    type="number"
                    step="any"
                    placeholder={t.longitude}
                    value={metadata.longitude}
                    onChange={(e) => setMetadata({...metadata, longitude: e.target.value})}
                  />
                </div>

                <Input
                  placeholder={t.tags}
                  value={metadata.tags}
                  onChange={(e) => setMetadata({...metadata, tags: e.target.value})}
                />

                <Textarea
                  placeholder={t.description}
                  value={metadata.description}
                  onChange={(e) => setMetadata({...metadata, description: e.target.value})}
                  rows={3}
                />

                <Button
                  onClick={handleUpload}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={uploading || files.length === 0}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? t.uploading : t.upload}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
