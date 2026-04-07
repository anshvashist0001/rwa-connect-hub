import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { galleryApi, type GalleryImage } from "@/lib/api";
import { demoGallery } from "@/lib/demoStore";
import { X, ZoomIn } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const mockImages: GalleryImage[] = [
  { id: 1, title: "Annual Diwali Celebration", category: "Events",   image_url: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=600&q=80", created_at: "2026-01-10T10:00:00Z" },
  { id: 2, title: "Society Garden",            category: "Premises", image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80", created_at: "2026-01-15T10:00:00Z" },
  { id: 3, title: "Kids Play Area",            category: "Premises", image_url: "https://images.unsplash.com/photo-1575783970733-1aaedde1db74?w=600&q=80", created_at: "2026-01-20T10:00:00Z" },
  { id: 4, title: "Republic Day Ceremony",     category: "Events",   image_url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80", created_at: "2026-01-26T10:00:00Z" },
  { id: 5, title: "Club House",                category: "Premises", image_url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80", created_at: "2026-02-05T10:00:00Z" },
  { id: 6, title: "Holi Celebration 2026",     category: "Events",   image_url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80", created_at: "2026-03-14T10:00:00Z" },
  { id: 7, title: "Swimming Pool",             category: "Premises", image_url: "https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=600&q=80", created_at: "2026-02-20T10:00:00Z" },
  { id: 8, title: "Tree Plantation Drive",     category: "Community",image_url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80", created_at: "2026-03-01T10:00:00Z" },
  { id: 9, title: "Main Gate",                 category: "Premises", image_url: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80", created_at: "2026-03-10T10:00:00Z" },
];

const CATEGORIES = ["All", "Events", "Premises", "Community"];

const Gallery = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightbox, setLightbox] = useState<GalleryImage | null>(null);

  const { data: images = demoGallery.getAll() } = useQuery({
    queryKey: ["gallery"],
    queryFn: async () => {
      try {
        const result = await galleryApi.getAll();
        return result.length > 0 ? result : demoGallery.getAll();
      } catch {
        return demoGallery.getAll();
      }
    },
    placeholderData: demoGallery.getAll(),
  });

  const filtered = activeCategory === "All"
    ? images
    : images.filter((img) => img.category === activeCategory);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="mb-10">
            <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Our Community</p>
            <h1 className="text-3xl md:text-5xl font-bold">Gallery</h1>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">No images in this category yet.</div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
              {filtered.map((img) => (
                <div
                  key={img.id}
                  className="break-inside-avoid group relative overflow-hidden rounded-xl cursor-pointer border border-border"
                  onClick={() => setLightbox(img)}
                >
                  <img
                    src={img.image_url.startsWith("http") || img.image_url.startsWith("blob:") || img.image_url.startsWith("data:") ? img.image_url : `${API_BASE}${img.image_url}`}
                    alt={img.title}
                    className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-4">
                    <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="text-xs font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full mb-1 inline-block">
                        {img.category}
                      </span>
                      <p className="text-white text-sm font-semibold">{img.title}</p>
                    </div>
                    <ZoomIn className="absolute top-3 right-3 w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-accent transition-colors"
            onClick={() => setLightbox(null)}
          >
            <X className="w-7 h-7" />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="max-w-4xl w-full">
            <img
              src={lightbox.image_url.startsWith("http") || lightbox.image_url.startsWith("blob:") || lightbox.image_url.startsWith("data:") ? lightbox.image_url : `${API_BASE}${lightbox.image_url}`}
              alt={lightbox.title}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <div className="text-center mt-4">
              <p className="text-white font-semibold">{lightbox.title}</p>
              <p className="text-white/50 text-xs mt-1">{lightbox.category}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
