import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { documentsApi, type Document } from "@/lib/api";
import { demoDocuments } from "@/lib/demoStore";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Download, FolderOpen, Upload, X, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const CATEGORIES = ["Bylaws & Rules", "Circulars", "Financial Reports", "Minutes of Meetings", "Others"];

const DocumentManagement = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Bylaws & Rules" });
  const [file, setFile] = useState<File | null>(null);

  const getGroupedDocuments = (docs: Document[]) => {
    return docs.reduce((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    }, {} as Record<string, Document[]>);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin-documents"],
    queryFn: documentsApi.getAll,
    placeholderData: () => {
      const docs = demoDocuments.getAll();
      return { documents: docs, grouped: getGroupedDocuments(docs) };
    },
  });

  const saveMutation = useMutation({
    mutationFn: (fd: FormData) => documentsApi.create(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-documents"] });
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded");
      setShowForm(false);
      setForm({ title: "", category: "Bylaws & Rules" });
      setFile(null);
    },
    onError: () => {
      let fileUrl = null;
      let filename = "document.pdf";
      let filesize = "0 KB";
      let filetype = "PDF";

      if (file) {
        fileUrl = URL.createObjectURL(file);
        filename = file.name;
        filesize = (file.size / 1024).toFixed(1) + " KB";
        filetype = file.name.split('.').pop()?.toUpperCase() || "PDF";
      }

      demoDocuments.create({
        title: form.title,
        category: form.category,
        file_url: fileUrl,
        file_name: filename,
        file_size: filesize,
        file_type: filetype,
      });
      
      const docs = demoDocuments.getAll();
      qc.setQueryData(["admin-documents"], { documents: docs, grouped: getGroupedDocuments(docs) });
      qc.setQueryData(["documents"], { documents: docs, grouped: getGroupedDocuments(docs) });
      
      toast.success("Document uploaded (Local Mode)");
      setShowForm(false);
      setForm({ title: "", category: "Bylaws & Rules" });
      setFile(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-documents"] });
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted");
    },
    onError: (_, id) => {
      demoDocuments.delete(id);
      const docs = demoDocuments.getAll();
      qc.setQueryData(["admin-documents"], { documents: docs, grouped: getGroupedDocuments(docs) });
      qc.setQueryData(["documents"], { documents: docs, grouped: getGroupedDocuments(docs) });
      toast.success("Document deleted (Local Mode)");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("category", form.category);
    fd.append("file", file);
    saveMutation.mutate(fd);
  };

  const grouped = data?.grouped || {};

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Documents</h2>
          <Button onClick={() => setShowForm(true)} variant="accent" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Upload Document
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm animate-pulse">Loading...</div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No documents uploaded yet.</div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, docs]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">{category}</h3>
                  <span className="text-xs text-muted-foreground">({(docs as Document[]).length})</span>
                </div>
                <div className="space-y-2">
                  {(docs as Document[]).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-accent">{doc.file_type}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">{doc.file_size} · {format(new Date(doc.created_at), 'dd MMM yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a
                          href={doc.file_url.startsWith("http") ? doc.file_url : (doc.file_url.startsWith("blob:") || doc.file_url.startsWith("data:") ? doc.file_url : `${API_BASE}${doc.file_url}`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-accent transition-colors"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <a
                          href={doc.file_url.startsWith("http") ? doc.file_url : (doc.file_url.startsWith("blob:") || doc.file_url.startsWith("data:") ? doc.file_url : `${API_BASE}${doc.file_url}`)}
                          download
                          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-accent transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => { if (confirm(`Delete "${doc.title}"?`)) deleteMutation.mutate(doc.id); }}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Upload Document</h3>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Society Bylaws 2024" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Category *</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">File *</label>
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-input rounded-lg p-6 cursor-pointer hover:border-accent/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{file ? file.name : "Click to upload PDF"}</span>
                  <span className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" variant="accent" className="flex-1" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default DocumentManagement;
