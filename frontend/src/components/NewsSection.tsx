import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { resolveImageUrl, getGoogleDriveAlternateUrls } from "@/lib/utils";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import img1 from "@/assets/other/DJI_20250823171339_0049_D.jpg";
import img2 from "@/assets/other/WhatsApp Image 2025-09-18 at 2.03.03 PM.jpeg";
import hebbalFlyover from "@/assets/other/Hebbal Flyover - Top Down.jpg";


const NewsSection = () => {
  type NewsItem = {
    id?: string;
    title: string;
    description: string;
    category: string;
    imageUrl: string;
    month: string;
    year: number;
    createdAt?: number;
  };
  const STORAGE_KEY = "bvp.news.items";

  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);

  // Fetch from backend and live update when admin changes
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await api.get("/content/news");
        const items = Array.isArray(res?.data?.newsItems) ? res.data.newsItems : [];
        const mapped: NewsItem[] = items.map((n: any, idx: number) => ({
          id: n._id || `${idx}-${n.title}`,
          title: n.title,
          description: n.description,
          category: n.category,
          imageUrl: resolveImageUrl(n.imageUrl || n.image),
          month: n.month,
          year: typeof n.year === 'number' ? n.year : Number(n.year),
          createdAt: Date.now(),
        })).filter(n => n.title && n.description && n.category && n.imageUrl && n.month && n.year);
        // newest first by year/month rough order, then take top 3
        mapped.reverse();
        setNewsItems(mapped.slice(0, 3));
      } catch (e) {
        console.warn("[NewsSection] Failed to fetch /content/news, falling back to localStorage");
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          const parsedRaw = raw ? (JSON.parse(raw) as any[]) : [];
          const normalized: NewsItem[] = parsedRaw.map((n, idx) => ({
            id: n.id || `${idx}-${n.title}`,
            title: n.title,
            description: n.description,
            category: n.category || n.type,
            imageUrl: resolveImageUrl(n.imageUrl || n.image),
            month: n.month,
            year: typeof n.year === 'number' ? n.year : Number(n.year),
            createdAt: n.createdAt || Date.now(),
          })).filter(n => n.title && n.description && n.category && n.imageUrl && n.month && n.year);
          normalized.reverse();
          setNewsItems(normalized.slice(0, 3));
        } catch {}
      }
    };

    const handler = () => {
      console.log("[NewsSection] Custom event received, refreshing news");
      fetchNews();
    };
    window.addEventListener("bvp:news:update", handler);
    fetchNews();
    return () => window.removeEventListener("bvp:news:update", handler);
  }, []);


  return (
    <section className="py-16 bg-gradient-to-b from-white to-muted/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">Latest News & Events</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stay updated with the latest announcements, project updates, and important notifications from Bangalore Development Authority
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {newsItems.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">No news items found. Check console for debug info.</p>
            </div>
          ) : (
            newsItems.map((item, index) => {
              const imgSrc = resolveImageUrl(item.imageUrl);
              console.log("[NewsSection] card", { id: item.id, title: item.title });
              return (
            <Card key={index} className="bg-white/90 backdrop-blur ring-1 ring-black/5 hover:shadow-lg transition-shadow cursor-pointer rounded-xl overflow-hidden">
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={imgSrc}
                  alt={item.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    console.warn("[NewsSection] image onError", { src: el.src, title: item.title });
                    const candidates = getGoogleDriveAlternateUrls(item.imageUrl);
                    const currentIndex = candidates.indexOf(el.src);
                    const next = candidates[currentIndex + 1] || candidates[0];
                    if (next && next !== el.src && !el.src.endsWith("/placeholder.svg")) {
                      console.log("[NewsSection] trying next candidate", next);
                      el.src = next;
                      return;
                    }
                    if (el.src.endsWith("/placeholder.svg")) return;
                    el.src = "/placeholder.svg";
                  }}
                  onLoad={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    console.log("[NewsSection] image onLoad", { src: el.src, title: item.title });
                  }}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {item.month} {item.year}
                </div>
              </div>
              <CardHeader className="pb-3">
                <div className="mb-2">
                  <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
                    {item.category}
                  </span>
                </div>
                <CardTitle className="text-xl leading-snug hover:text-primary transition-colors">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 mb-4 line-clamp-3">
                  {item.description}
                </CardDescription>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{item.month} {item.year}</span>
                  <Link to={`/news/${item.id}`} onClick={() => console.log('[NewsSection] navigate detail', { id: item.id })} className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium">
                    Read More <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
            );
            })
          )}
        </div>

        <div className="text-center mt-10">
          <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={() => window.location.assign('/news')}>
            View All News & Events
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;