
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Search, MapPin, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Contribution } from "@/api/entities";
import { WorkshopMedia } from "@/api/entities";

export default function SearchPanel({ isOpen, onClose, language, onResultClick, scale }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const translations = {
    tr: {
      title: "Harita Araması",
      subtitle: "Konum, etiket veya başlığa göre arama yapın",
      searchPlaceholder: "Yer adı, başlık veya etiket arayın...",
      filterAll: "Tümü",
      filterContributions: "Katkılar",
      filterMedia: "Medya",
      noResults: "Sonuç bulunamadı",
      searching: "Aranıyor...",
      contribution: "Katkı",
      workshopMedia: "Atölye Medyası"
    },
    en: {
      title: "Map Search",
      subtitle: "Search by location, tags, or title",
      searchPlaceholder: "Search place name, title, or tags...",
      filterAll: "All",
      filterContributions: "Contributions",
      filterMedia: "Media",
      noResults: "No results found",
      searching: "Searching...",
      contribution: "Contribution",
      workshopMedia: "Workshop Media"
    }
  };

  const t = translations[language];

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      let allResults = [];

      // Search contributions
      if (filterType === 'all' || filterType === 'contributions') {
        const contributions = await Contribution.list();
        const filteredContributions = contributions.filter(item => 
          item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.contributor_name?.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(item => ({ ...item, type: 'contribution' }));
        
        allResults = [...allResults, ...filteredContributions];
      }

      // Search workshop media
      if (filterType === 'all' || filterType === 'media') {
        const media = await WorkshopMedia.list();
        const filteredMedia = media.filter(item => 
          item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.location_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        ).map(item => ({ ...item, type: 'media' }));
        
        allResults = [...allResults, ...filteredMedia];
      }

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
    }
    setIsSearching(false);
  }, [searchTerm, filterType]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [handleSearch]);

  const handleResultClick = (result) => {
    if (result.latitude && result.longitude) {
      onResultClick({
        lat: result.latitude,
        lng: result.longitude,
        data: result
      });
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
          style={{ transform: `scale(${scale})`, transformOrigin: 'top right' }}
          className="absolute right-12 top-24 bottom-20 w-80 z-[1100]"
        >
          <Card className="h-full bg-white/70 backdrop-blur-lg shadow-2xl border border-white/20">
            <CardHeader className="border-b border-white/10 bg-gray-600/80 backdrop-blur-lg text-white rounded-t-lg">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    {t.title}
                  </CardTitle>
                  <p className="text-gray-100 text-sm mt-1">{t.subtitle}</p>
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

            <CardContent className="p-4 h-full overflow-hidden flex flex-col">
              <div className="space-y-3 mb-4">
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-gray-200"
                />
                
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.filterAll}</SelectItem>
                    <SelectItem value="contributions">{t.filterContributions}</SelectItem>
                    <SelectItem value="media">{t.filterMedia}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isSearching ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-2"></div>
                    {t.searching}
                  </div>
                ) : results.length === 0 && searchTerm ? (
                  <div className="text-center py-8 text-gray-500">
                    {t.noResults}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <motion.div
                        key={`${result.type}-${result.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <button
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                <span className="text-xs text-gray-500">
                                  {result.type === 'contribution' ? t.contribution : t.workshopMedia}
                                </span>
                              </div>
                              <h4 className="font-medium text-sm truncate mb-1">
                                {result.title}
                              </h4>
                              {result.description && (
                                <p className="text-xs text-gray-600 line-clamp-2">
                                  {result.description}
                                </p>
                              )}
                              {result.location_name && (
                                <p className="text-xs text-gray-500 mt-1">
                                  📍 {result.location_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
