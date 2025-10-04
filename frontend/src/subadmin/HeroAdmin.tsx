import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/api";
import { resolveImageUrl, getGoogleDriveAlternateUrls } from "@/lib/utils";

type HeroSlide = {
  imageUrl: string;
  title?: string;
  subtitle?: string;
};

const STORAGE_KEY = "Content.hero.slides";

const defaultSlides: HeroSlide[] = [];

const HeroAdmin = () => {
  const { toast } = useToast();
  const [slides, setSlides] = useState<HeroSlide[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultSlides;
      const parsed = JSON.parse(raw) as HeroSlide[];
      return parsed && parsed.length > 0 ? parsed : defaultSlides;
    } catch {
      return defaultSlides;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
      window.dispatchEvent(new Event("bvp:hero:update"));
    } catch {}
  }, [slides]);

  const addSlide = () => {
    setSlides((prev) => [...prev, { imageUrl: "", title: "", subtitle: "" }]);
  };

  const removeSlide = (index: number) => {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSlide = (index: number, patch: Partial<HeroSlide>) => {
    setSlides((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const handleFileSelect = (index: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      updateSlide(index, { imageUrl: result });
    };
    reader.readAsDataURL(file);
  };

  const validCount = useMemo(() => slides.filter((s) => s.imageUrl.trim() !== "").length, [slides]);

  // Load banner images from backend (GET /content/all-content -> banner array)
  useEffect(() => {
    const load = async () => {
      try {
        console.log("[HeroAdmin] GET /content/all-content - loading banner images...");
        const res = await api.get("/admin/all-content");
        console.log("[HeroAdmin] GET /content/all-content response", res?.status, res?.data);
        const images: string[] = res?.data?.banner || [];
        if (Array.isArray(images) && images.length > 0) {
          setSlides(images.map((url) => ({ imageUrl: url, title: "", subtitle: "" })));
          toast({ title: "Banner loaded", description: `${images.length} image(s)` });
        }
      } catch (error: any) {
        console.error("[HeroAdmin] GET /content/all-content error", error?.message, error?.response?.data);
      }
    };
    load();
  }, [toast]);

  const saveToBackend = async () => {
    try {
      const images = slides.map((s) => s.imageUrl.trim()).filter(Boolean);
      console.log("[HeroAdmin] PUT /content/banner - saving images", images);
      const res = await api.put("/admin/banner", { images });
      console.log("[HeroAdmin] PUT /content/banner response", res?.status, res?.data);
      toast({ title: "Banner saved", description: `${images.length} image(s)` });
    } catch (error: any) {
      console.error("[HeroAdmin] PUT /content/banner error", error?.message, error?.response?.data);
      toast({ title: "Save failed", description: error?.response?.data?.message || "Could not save banner", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-4">
        <div className="text-2xl font-semibold">Banner/Hero</div>
        <div className="text-sm text-muted-foreground">Manage homepage hero slides</div>
      </div>
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">{validCount} slide(s) with images</div>
        <div className="flex gap-2">
          <Button onClick={() => setSlides(defaultSlides)} variant="secondary">Restore defaults</Button>
          <Button onClick={addSlide} variant="default">Add slide</Button>
          <Button onClick={saveToBackend} variant="default">Save to backend</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {slides.map((slide, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base">Slide #{index + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`image-${index}`}>Image URL</Label>
                  <Input
                    id={`image-${index}`}
                    placeholder="https://..."
                    value={slide.imageUrl}
                    onChange={(e) => updateSlide(index, { imageUrl: e.target.value })}
                  />
                  <div className="text-[11px] text-muted-foreground">Paste a public URL or upload a file below.</div>
                  <div className="pt-1 space-y-2">
                    <Label htmlFor={`file-${index}`}>Upload image</Label>
                    <Input
                      id={`file-${index}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(index, e.target.files?.[0] ?? null)}
                    />
                    <div className="text-[11px] text-muted-foreground">Supported: JPG, PNG, GIF, WebP. Saved locally.</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`title-${index}`}>Title (optional)</Label>
                  <Input
                    id={`title-${index}`}
                    placeholder="Headline"
                    value={slide.title ?? ""}
                    onChange={(e) => updateSlide(index, { title: e.target.value })}
                  />
                  <Label htmlFor={`subtitle-${index}`}>Subtitle (optional)</Label>
                  <Input
                    id={`subtitle-${index}`}
                    placeholder="Subheadline"
                    value={slide.subtitle ?? ""}
                    onChange={(e) => updateSlide(index, { subtitle: e.target.value })}
                  />
                </div>
              </div>

              {slide.imageUrl && (
                <div className="mt-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-md border">
                    <img
                      src={resolveImageUrl(slide.imageUrl)}
                      className="w-full h-full object-cover"
                      alt="preview"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        console.warn("[HeroAdmin] preview image onError", el.src);
                        const candidates = getGoogleDriveAlternateUrls(slide.imageUrl);
                        const currentIndex = candidates.indexOf(el.src);
                        const next = candidates[currentIndex + 1] || candidates[0];
                        if (next && next !== el.src) {
                          console.log("[HeroAdmin] trying next candidate", next);
                          el.src = next;
                          return;
                        }
                      }}
                      onLoad={(e) => {
                        const el = e.currentTarget as HTMLImageElement;
                        console.log("[HeroAdmin] preview image onLoad", el.src);
                      }}
                    />
                    {(slide.title || slide.subtitle) && (
                      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/45" />
                    )}
                    {(slide.title || slide.subtitle) && (
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        {slide.title && <div className="text-xl font-semibold">{slide.title}</div>}
                        {slide.subtitle && <div className="text-sm opacity-90">{slide.subtitle}</div>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 flex items-center justify-end">
                <Button variant="destructive" onClick={() => removeSlide(index)}>Remove slide</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="text-xs text-muted-foreground">Changes are auto-saved to your browser storage. Homepage updates live.</div>
    </div>
  );
};

export default HeroAdmin;


