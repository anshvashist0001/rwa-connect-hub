import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { galleryApi, type GalleryImage } from "@/lib/api";
import { demoGallery } from "@/lib/demoStore";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, X, ImageIcon, Plus } from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const CATEGORIES = ["Events", "Premises", "Community"];

const emptyForm = { title: "", category: "Events" };

const GalleryManagement = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const syncPublic = (items: GalleryImage[]) => {
    qc.setQueryData(["gallery"], items);
    qc.invalidateQueries({ queryKey: ["gallery"] });
  };

  const { data: images = demoGallery.getAll() } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: galleryApi.getAll,
    placeholderData: demoGallery.getAll(),
  });

  const uploadMutation = useMutation({
    mutationFn: (fd: FormData) => galleryApi.upload(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image uploaded");
      resetForm();
    },
    onError: () => {
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        demoGallery.create({ title: form.title || "Untitled", category: form.category, image_url: imageUrl });
        const updated = demoGallery.getAll();
        qc.setQueryData(["admin-gallery"], updated);
        syncPublic(updated);
        toast.success("Image added (Local Mode)");
        resetForm();
      } else {
        demoGallery.create({ title: form.title || "Untitled", category: form.category, image_url: "" });
        const updated = demoGallery.getAll();
        qc.setQueryData(["admin-gallery"], updated);
        syncPublic(updated);
        toast.success("Image added (Local Mode)");
        resetForm();
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => galleryApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      toast.success("Image deleted");
    },
    onError: (_, id) => {
      demoGallery.delete(id);
      const updated = demoGallery.getAll();
      qc.setQueryData(["admin-gallery"], updated);
      syncPublic(updated);
      toast.success("Image deleted");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please select an image");
    if (!form.title.trim()) return toast.error("Title is required");
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("category", form.category);
    fd.append("image", file);
    uploadMutation.mutate(fd);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFile(null);
    setPreview(null);
    setShowForm(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this image?")) return;
    deleteMutation.mutate(id);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Gallery Management</h2>
          <Button onClick={() => setShowForm(true)} variant="accent" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Upload Image
          </Button>
        </div>

        {/* Upload form */}
        {showForm && (
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Upload New Image</h3>
              <button onClick={resetForm} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
              {/* File drop zone */}
              <div>
                <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors hover:border-accent/50 bg-secondary/30">
                  {preview ? (
                    <img src={preview} alt="preview" className="max-h-48 rounded-lg object-contain" />
                  ) : (
                    <>
                      <ImageIcon className="w-10 h-10 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to select image</span>
                      <span className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 10MB</span>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Fields */}
              <div className="space-y-4 flex flex-col justify-center">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Title <span className="text-destructive">*</span></label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Diwali Celebration 2026"
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Category <span className="text-destructive">*</span></label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" variant="accent" className="flex-1 gap-2" disabled={uploadMutation.isPending}>
                    <Upload className="w-4 h-4" />
                    {uploadMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Image grid */}
        {images.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            No images yet. Upload your first image.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
            {images.map((img) => (
              <div key={img.id} className="group relative rounded-xl overflow-hidden border border-border aspect-square bg-secondary">
                <img
                  src={img.image_url.startsWith("http") || img.image_url.startsWith("blob:") || img.image_url.startsWith("data:") ? img.image_url : `${API_BASE}${img.image_url}`}
                  alt={img.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex flex-col items-start justify-end p-3">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity w-full">
                    <span className="text-[10px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full">{img.category}</span>
                    <p className="text-white text-xs font-medium mt-1 line-clamp-2">{img.title}</p>
                    <button
                      onClick={() => handleDelete(img.id)}
                      className="mt-2 p-1.5 bg-destructive/90 hover:bg-destructive text-white rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default GalleryManagement;
