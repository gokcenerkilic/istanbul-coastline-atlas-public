
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, MapPin, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Contribution, generateSequentialId } from "@/api/entities";

export default function ContributionPanel({
  isOpen,
  onClose,
  language,
  isLocationMode,
  setIsLocationMode,
  coords,
  scale // New prop for scaling
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contributor_name: '',
    contributor_email: '',
    category: 'observation',
    latitude: '', // These will be updated by useEffect from coords prop
    longitude: '' // These will be updated by useEffect from coords prop
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (coords) {
      setFormData(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
    } else {
      // Clear lat/lng if coords become null/undefined (e.g., panel closes or selection reset)
      setFormData(prev => ({ ...prev, latitude: '', longitude: '' }));
    }
  }, [coords]);

  const translations = {
    tr: {
      title: "Yeni Katkı Ekle",
      subtitle: "Haritaya gözlemlerinizi ve yorumlarınızı ekleyin",
      titleField: "Başlık",
      description: "Açıklama",
      name: "Adınız",
      email: "E-posta",
      category: "Kategori",
      location: "Konum Seç",
      selectOnMap: "Haritadan Seç",
      selecting: "Seçiliyor...",
      locationSelected: "Konum Seçildi",
      submit: "Gönder",
      submitting: "Gönderiliyor...",
      categories: {
        observation: "Gözlem",
        historical: "Tarihsel",
        environmental: "Çevresel",
        cultural: "Kültürel",
        other: "Diğer"
      }
    },
    en: {
      title: "Add New Contribution",
      subtitle: "Add your observations and comments to the map",
      titleField: "Title",
      description: "Description",
      name: "Your Name",
      email: "Email",
      category: "Category",
      location: "Select Location",
      selectOnMap: "Select from Map",
      selecting: "Selecting...",
      locationSelected: "Location Selected",
      submit: "Submit",
      submitting: "Submitting...",
      categories: {
        observation: "Observation",
        historical: "Historical",
        environmental: "Environmental",
        cultural: "Cultural",
        other: "Other"
      }
    }
  };

  const t = translations[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      alert(language === 'tr' ? 'Lütfen haritadan bir konum seçin' : 'Please select a location on the map');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate sequential ID
      const contributionId = await generateSequentialId(Contribution, 'CONT');
      
      await Contribution.create({
        contributionId,
        type: 'observation', // or formData.category
        title: formData.title,
        description: formData.description,
        contributor_name: formData.contributor_name,
        contributor_email: formData.contributor_email,
        location: {
          lat: parseFloat(formData.latitude),
          lng: parseFloat(formData.longitude)
        },
        media_url: '', // Will be populated when file upload is added
        status: 'pending',
        created_date: new Date()
      });
      // Reset form data after successful submission
      setFormData({
        title: '',
        description: '',
        contributor_name: '',
        contributor_email: '',
        category: 'observation',
        latitude: '', // Clear latitude/longitude as well
        longitude: ''
      });
      setIsLocationMode(false); // Reset location selection mode
      onClose(); // Close the panel
    } catch (error) {
      console.error('Error submitting contribution:', error);
      alert(language === 'tr' ? 'Katkı gönderilirken bir hata oluştu.' : 'An error occurred while submitting the contribution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          style={{ transform: `scale(${scale})`, transformOrigin: 'top right' }} // Apply scaling here
          className="absolute right-12 top-24 bottom-20 w-96 z-[1100]"
        >
          <Card className="h-full bg-white/70 backdrop-blur-lg shadow-2xl border border-white/20">
            <CardHeader className="border-b border-white/10 bg-blue-600/80 backdrop-blur-lg text-white rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {t.title}
                  </CardTitle>
                  <p className="text-blue-100 text-sm mt-1">{t.subtitle}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsLocationMode(false); // Ensure location mode is off when closing
                    onClose();
                  }}
                  className="text-white hover:bg-white/20 mt-[-2px] mr-[-2px]"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder={t.titleField}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="border-gray-200"
                  />
                </div>

                <div>
                  <Textarea
                    placeholder={t.description}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="border-gray-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder={t.name}
                    value={formData.contributor_name}
                    onChange={(e) => setFormData({ ...formData, contributor_name: e.target.value })}
                    className="border-gray-200"
                  />
                  <Input
                    type="email"
                    placeholder={t.email}
                    value={formData.contributor_email}
                    onChange={(e) => setFormData({ ...formData, contributor_email: e.target.value })}
                    className="border-gray-200"
                  />
                </div>

                <div>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder={t.category} />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(t.categories).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{t.location}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant={isLocationMode ? "default" : "outline"}
                      onClick={() => setIsLocationMode(!isLocationMode)}
                    >
                      {isLocationMode ? t.selecting : (coords ? t.locationSelected : t.selectOnMap)}
                    </Button>
                  </div>
                  {coords && (
                    <p className="text-xs text-gray-600">
                      {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting || !formData.title || !coords}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t.submitting}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> {t.submit}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
