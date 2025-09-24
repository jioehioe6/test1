import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Image, 
  ChevronLeft, 
  ChevronRight, 
  Search,
  Calendar,
  Eye,
  Grid3X3,
  List
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import api from "@/lib/api";
import { resolveImageUrl, getGoogleDriveAlternateUrls } from "@/lib/utils";

interface PhotoGalleryItem {
  id: string;
  image: string;
  heading: string;
  subheading: string;
  createdAt: string;
  updatedAt: string;
}

const PhotoGallery = () => {
  const [photos, setPhotos] = useState<PhotoGalleryItem[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoGalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoGalleryItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Sample photos data
  const samplePhotos: PhotoGalleryItem[] = [
    {
      id: "1",
      image: "/Projects/BDA Office/bda day view.jpg",
      heading: "BDA Office - Day View",
      subheading: "Modern architecture of Bangalore Development Authority office building",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15"
    },
    {
      id: "2",
      image: "/Projects/BDA Office/Bda night view.jpg",
      heading: "BDA Office - Night View",
      subheading: "Illuminated BDA office building showcasing urban development",
      createdAt: "2024-01-16",
      updatedAt: "2024-01-16"
    },
    {
      id: "3",
      image: "/Projects/Hebbal Flyover/Hebbal Flyover - Top Down.jpg",
      heading: "Hebbal Flyover - Aerial View",
      subheading: "Bird's eye view of the iconic Hebbal flyover infrastructure",
      createdAt: "2024-02-10",
      updatedAt: "2024-02-10"
    },
    {
      id: "4",
      image: "/Projects/Military Memorial/military memorial.jpg",
      heading: "Military Memorial",
      subheading: "Dedicated memorial honoring our brave military personnel",
      createdAt: "2024-02-15",
      updatedAt: "2024-02-15"
    },
    {
      id: "5",
      image: "/Projects/Layouts/Nadaprabhu Kempegowda Layout (NPKL)/Block 1.jpg",
      heading: "NPKL Block 1",
      subheading: "Nadaprabhu Kempegowda Layout - Modern residential development",
      createdAt: "2024-03-01",
      updatedAt: "2024-03-01"
    },
    {
      id: "6",
      image: "/Projects/Layouts/Arkavathy Layout/HBR Layout.jpg",
      heading: "HBR Layout - Arkavathy",
      subheading: "Well-planned residential layout in Arkavathy development",
      createdAt: "2024-03-10",
      updatedAt: "2024-03-10"
    },
    {
      id: "7",
      image: "/Projects/Alur/Alur.jpg",
      heading: "Alur Development",
      subheading: "Comprehensive development project in Alur region",
      createdAt: "2024-03-20",
      updatedAt: "2024-03-20"
    },
    {
      id: "8",
      image: "/Projects/Kaniminike/Kaniminike Green Buildings.jpg",
      heading: "Kaniminike Green Buildings",
      subheading: "Eco-friendly sustainable building development",
      createdAt: "2024-04-05",
      updatedAt: "2024-04-05"
    },
    {
      id: "9",
      image: "/Projects/Kommaghatta/Kommaghatta all buildings.jpg",
      heading: "Kommaghatta Development",
      subheading: "Complete infrastructure development in Kommaghatta area",
      createdAt: "2024-04-15",
      updatedAt: "2024-04-15"
    },
    {
      id: "10",
      image: "/Projects/Bellandur Lake/DJI_20250823103408_0015_D.JPG",
      heading: "Bellandur Lake Restoration",
      subheading: "Aerial view of the ongoing lake restoration project",
      createdAt: "2024-05-01",
      updatedAt: "2024-05-01"
    }
  ];

  // Load photos from backend (GET /content/gallery)
  useEffect(() => {
    const loadPhotos = async () => {
      setIsLoading(true);
      try {
        console.log("[PhotoGalleryPage] GET /content/gallery - loading...");
        const res = await api.get("/content/gallery");
        console.log("[PhotoGalleryPage] GET /content/gallery response", res?.status, res?.data);
        const arr = res?.data?.galleryImages || res?.data?.images || [];
        const mapped: PhotoGalleryItem[] = arr.map((g: any, idx: number) => ({
          id: g._id || `${idx}-${g.image}`,
          image: resolveImageUrl(g.image),
          heading: g.title || g.heading || "",
          subheading: g.description || g.subheading || "",
          createdAt: g.createdAt || new Date().toISOString(),
          updatedAt: g.updatedAt || new Date().toISOString(),
        }));
        setPhotos(mapped);
        setFilteredPhotos(mapped);
      } catch (error) {
        console.error("[PhotoGalleryPage] GET /content/gallery error", error);
        // Fallback to localStorage, then sample
        try {
          const savedPhotos = localStorage.getItem('photoGallery');
          if (savedPhotos) {
            const parsedPhotos = JSON.parse(savedPhotos);
            setPhotos(parsedPhotos);
            setFilteredPhotos(parsedPhotos);
          } else {
            setPhotos(samplePhotos);
            setFilteredPhotos(samplePhotos);
          }
        } catch {
          setPhotos(samplePhotos);
          setFilteredPhotos(samplePhotos);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadPhotos();
    const handler = () => loadPhotos();
    window.addEventListener("bvp:gallery:update", handler);
    return () => window.removeEventListener("bvp:gallery:update", handler);
  }, []);

  // Filter photos based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPhotos(photos);
    } else {
      const filtered = photos.filter(photo =>
        photo.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photo.subheading.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPhotos(filtered);
    }
  }, [searchTerm, photos]);

  const handlePhotoClick = (photo: PhotoGalleryItem, index: number) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
    setIsDialogOpen(true);
  };

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : filteredPhotos.length - 1;
    setCurrentIndex(newIndex);
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  const handleNext = () => {
    const newIndex = currentIndex < filteredPhotos.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setSelectedPhoto(filteredPhotos[newIndex]);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Photo Gallery</h1>
              <p className="text-lg text-gray-600">Loading photos...</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 h-64 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Photo Gallery</h1>
            <p className="text-lg text-gray-600">
              Explore our collection of {photos.length} photos
            </p>
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search photos by heading or subheading..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              Showing {filteredPhotos.length} of {photos.length} photos
              {searchTerm && ` for "${searchTerm}"`}
            </p>
          </div>

          {/* Photos Grid/List */}
          {filteredPhotos.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No photos found' : 'No photos available'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Check back later for new photos'
                }
              </p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {filteredPhotos.map((photo, index) => (
                <Card 
                  key={photo.id} 
                  className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300"
                  onClick={() => handlePhotoClick(photo, index)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="relative">
                        <img
                          src={photo.image}
                          alt={photo.heading}
                          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            console.warn("[PhotoGalleryPage] image onError", { src: el.src, heading: photo.heading });
                            const candidates = getGoogleDriveAlternateUrls(photo.image);
                            const currentIndex = candidates.indexOf(el.src);
                            const next = candidates[currentIndex + 1] || candidates[0];
                            if (next && next !== el.src) {
                              console.log("[PhotoGalleryPage] trying next candidate", next);
                              el.src = next;
                            }
                          }}
                          onLoad={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            console.log("[PhotoGalleryPage] image onLoad", { src: el.src, heading: photo.heading });
                          }}
                        />
                        
                        {/* Overlay with heading and subheading */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="text-center text-white p-4">
                            <h3 className="text-lg font-semibold mb-2">{photo.heading}</h3>
                            {photo.subheading && (
                              <p className="text-sm opacity-90">{photo.subheading}</p>
                            )}
                          </div>
                        </div>

                        {/* View icon overlay */}
                        <div className="absolute top-3 right-3 bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{photo.heading}</h3>
                        {photo.subheading && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{photo.subheading}</p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(photo.createdAt)}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Gallery
                          </Badge>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <img
                          src={photo.image}
                          alt={photo.heading}
                          className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            console.warn("[PhotoGalleryPage] list image onError", { src: el.src, heading: photo.heading });
                            const candidates = getGoogleDriveAlternateUrls(photo.image);
                            const currentIndex = candidates.indexOf(el.src);
                            const next = candidates[currentIndex + 1] || candidates[0];
                            if (next && next !== el.src) {
                              console.log("[PhotoGalleryPage] list trying next candidate", next);
                              el.src = next;
                            }
                          }}
                          onLoad={(e) => {
                            const el = e.currentTarget as HTMLImageElement;
                            console.log("[PhotoGalleryPage] list image onLoad", { src: el.src, heading: photo.heading });
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-2">{photo.heading}</h3>
                          {photo.subheading && (
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{photo.subheading}</p>
                          )}
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(photo.createdAt)}</span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Photo Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedPhoto?.heading}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPhoto && (
            <div className="space-y-4">
              {/* Image with navigation */}
              <div className="relative">
                <img
                  src={selectedPhoto.image}
                  alt={selectedPhoto.heading}
                  className="w-full h-96 object-cover rounded-lg"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    console.warn("[PhotoGalleryPage] modal image onError", { src: el.src, heading: selectedPhoto.heading });
                    const candidates = getGoogleDriveAlternateUrls(selectedPhoto.image);
                    const currentIndex = candidates.indexOf(el.src);
                    const next = candidates[currentIndex + 1] || candidates[0];
                    if (next && next !== el.src) {
                      console.log("[PhotoGalleryPage] modal trying next candidate", next);
                      el.src = next;
                    }
                  }}
                  onLoad={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    console.log("[PhotoGalleryPage] modal image onLoad", { src: el.src, heading: selectedPhoto.heading });
                  }}
                />
                
                {/* Navigation buttons */}
                {filteredPhotos.length > 1 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100"
                      onClick={handlePrevious}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100"
                      onClick={handleNext}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}

                {/* Photo counter */}
                {filteredPhotos.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {currentIndex + 1} / {filteredPhotos.length}
                  </div>
                )}
              </div>

              {/* Photo details */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{selectedPhoto.heading}</h3>
                  {selectedPhoto.subheading && (
                    <p className="text-gray-600">{selectedPhoto.subheading}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Added on {formatDate(selectedPhoto.createdAt)}</span>
                  </div>
                  {selectedPhoto.updatedAt !== selectedPhoto.createdAt && (
                    <Badge variant="secondary" className="text-xs">
                      Updated
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PhotoGallery;
