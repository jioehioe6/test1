import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { resolveImageUrl, getGoogleDriveAlternateUrls } from "@/lib/utils";
import api from "@/lib/api";

type NewsItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  month: string;
  year: number;
  createdAt: number;
};

const STORAGE_KEY = "leadContent";
// Default fallback items (can be empty or some sample news)
const DEFAULT_ITEMS: NewsItem[] = [];

const NewsAdmin = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState<string>("");

  const [items, setItems] = useState<NewsItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as NewsItem[];
        return parsed.length > 0 ? parsed : DEFAULT_ITEMS;
      }
      return DEFAULT_ITEMS;
    } catch {
      return DEFAULT_ITEMS;
    }
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      console.log("[NewsAdmin] Saving items to localStorage:", items);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      console.log("[NewsAdmin] Dispatched bvp:news:update event");
      window.dispatchEvent(new Event("bvp:news:update"));
    } catch (error) {
      console.error("[NewsAdmin] Error saving to localStorage:", error);
    }
  }, [items]);

  const addNews = async () => {
    const yr = parseInt(year, 10);
    if (!title.trim() || !description.trim() || !category.trim() || !imageUrl.trim() || !month.trim() || isNaN(yr)) {
      console.warn("[NewsAdmin] Validation failed", {
        title,
        description,
        category,
        imageUrl,
        month,
        year,
        parsedYear: yr,
      });
      toast({ title: "Missing fields", description: "Please fill all fields correctly." });
      return;
    }

    const payloadItem = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      imageUrl: imageUrl.trim(),
      month: month.trim(),
      year: yr,
    };

    try {
      setIsSubmitting(true);
      const requestBody = { newsItems: [payloadItem] };
      console.log("[NewsAdmin] Submitting news to backend", {
        url: "/leadadmin/news",
        body: requestBody,
      });
      const response = await api.put("/leadadmin/news", requestBody);
      console.log("[NewsAdmin] Backend response", {
        status: response?.status,
        data: response?.data,
      });

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item: NewsItem = {
        id,
        ...payloadItem,
        createdAt: Date.now(),
      };

      setItems((prev) => [item, ...prev]);

      setTitle("");
      setDescription("");
      setCategory("");
      setImageUrl("");
      setMonth("");
      setYear("");

      toast({ title: "News added", description: item.title });
    } catch (error: any) {
      console.error("[NewsAdmin] Error posting news:", error);
      console.log("[NewsAdmin] Error details", {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        method: error?.config?.method,
        requestBody: error?.config?.data,
      });
      const message = error?.response?.data?.message || error?.message || "Failed to add news. Please try again.";
      toast({ title: "Error", description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeNews = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Removed", description: "News item deleted." });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <div className="mb-4">
        <div className="text-2xl font-semibold">News Manager</div>
        <div className="text-sm text-muted-foreground">Add news cards for Latest News & Events</div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add news</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="news-title">Title</Label>
              <Input id="news-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-category">Type</Label>
              <Input id="news-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Category" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="news-desc">Description</Label>
              <Textarea id="news-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" rows={4} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-month">Month</Label>
              <Input id="news-month" value={month} onChange={(e) => setMonth(e.target.value)} placeholder="e.g., Mar" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="news-year">Year</Label>
              <Input id="news-year" type="number" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2025" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="news-image-url">Image URL (Google Drive link)</Label>
              <Input
                id="news-image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste Google Drive or image link"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addNews}>Add</Button>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.length === 0 && <div className="text-sm text-muted-foreground">No news added yet.</div>}
            {items.map((n) => {
              const imgSrc = resolveImageUrl(n.imageUrl);
              console.log("[NewsAdmin] preview image", { original: n.imageUrl, resolved: imgSrc, title: n.title });
              return (
              <div key={n.id} className="rounded-md border p-3 flex gap-3">
                <img
                  src={imgSrc}
                  alt={n.title}
                  className="w-28 h-20 object-cover rounded"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    console.warn("[NewsAdmin] image onError", { src: el.src, title: n.title });
                    const candidates = getGoogleDriveAlternateUrls(n.imageUrl);
                    const currentIndex = candidates.indexOf(el.src);
                    const next = candidates[currentIndex + 1] || candidates[0];
                    if (next && next !== el.src && !el.src.endsWith("/placeholder.svg")) {
                      console.log("[NewsAdmin] trying next candidate", next);
                      el.src = next;
                    }
                  }}
                  onLoad={(e) => {
                    const el = e.currentTarget as HTMLImageElement;
                    console.log("[NewsAdmin] image onLoad", { src: el.src, title: n.title });
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{n.title}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {n.category} · {n.month} {n.year}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{n.description}</div>
                </div>
                <div className="flex items-center">
                  <Button variant="destructive" onClick={() => removeNews(n.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewsAdmin;
