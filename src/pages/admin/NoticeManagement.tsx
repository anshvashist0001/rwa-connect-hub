import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { noticesApi, type Notice } from "@/lib/api";
import { demoNotices } from "@/lib/demoStore";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Share2, FileText, AlertTriangle, Info, X, Upload, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const typeConfig = {
  alert: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  important: { icon: FileText, color: "text-accent", bg: "bg-accent/10" },
  general: { icon: Info, color: "text-muted-foreground", bg: "bg-secondary" },
};

const emptyForm = { title: "", content: "", type: "general" as Notice["type"] };

const NoticeManagement = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);

  const syncPublic = (items: Notice[]) => {
    // Push changes to the public "notices" query cache so public page updates instantly
    qc.setQueryData(["notices", "all"], items);
    qc.setQueryData(["notices", undefined], items);
    qc.invalidateQueries({ queryKey: ["notices"] });
  };

  const { data: notices = demoNotices.getAll(), isLoading } = useQuery({
    queryKey: ["admin-notices"],
    queryFn: () => noticesApi.getAll(),
    placeholderData: demoNotices.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing ? noticesApi.update(editing.id, data) : noticesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
      qc.invalidateQueries({ queryKey: ["notices"] });
      toast.success(editing ? "Notice updated" : "Notice created");
      closeForm();
    },
    onError: () => {
      // Demo mode: persist to localStorage with Object URL for files
      let fileUrl = null;
      let filename = null;
      let filesize = null;

      if (file) {
        fileUrl = URL.createObjectURL(file);
        filename = file.name;
        filesize = (file.size / 1024).toFixed(1) + " KB";
      }

      if (editing) {
        demoNotices.update(editing.id, { 
          title: form.title, 
          content: form.content, 
          type: form.type,
          ...(file && { file_url: fileUrl, file_name: filename, file_size: filesize })
        });
        toast.success("Notice updated (Local Mode)");
      } else {
        demoNotices.create({ 
          title: form.title, 
          content: form.content, 
          type: form.type, 
          file_url: fileUrl, 
          file_name: filename, 
          file_size: filesize, 
          is_active: true 
        });
        toast.success("Notice created (Local Mode)");
      }
      
      const updated = demoNotices.getAll();
      qc.setQueryData(["admin-notices"], updated);
      syncPublic(updated);
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: noticesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-notices"] });
      qc.invalidateQueries({ queryKey: ["notices"] });
      toast.success("Notice deleted");
    },
    onError: (_, id) => {
      demoNotices.delete(id);
      const updated = demoNotices.getAll();
      qc.setQueryData(["admin-notices"], updated);
      syncPublic(updated);
      toast.success("Notice deleted");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("content", form.content);
    fd.append("type", form.type);
    if (file) fd.append("file", file);
    saveMutation.mutate(fd);
  };

  const openEdit = (n: Notice) => {
    setEditing(n);
    setForm({ title: n.title, content: n.content || "", type: n.type });
    setFile(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
  };

  const whatsappShare = (n: Notice) => {
    const siteUrl = window.location.origin;
    const msg = `📢 *${n.title}*\n\n${n.content || ''}\n\n${n.file_url ? `View attachment: ${siteUrl}${n.file_url}` : ''}\n\n— RWA Shyam Kunj`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Notices</h2>
          <Button onClick={() => setShowForm(true)} variant="accent" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Notice
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm animate-pulse">Loading...</div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No notices yet. Create your first one.</div>
        ) : (
          <div className="space-y-3">
            {notices.map((n) => {
              const config = typeConfig[n.type];
              const Icon = config.icon;
              return (
                <div key={n.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm truncate">{n.title}</h3>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${config.bg} ${config.color}`}>{n.type}</span>
                    </div>
                    {n.content && <p className="text-xs text-muted-foreground line-clamp-2">{n.content}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), 'dd MMM yyyy')}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {n.file_url && n.file_url !== "null" && (
                      <a href={n.file_url.startsWith("http") ? n.file_url : (n.file_url.startsWith("blob:") || n.file_url.startsWith("data:") ? n.file_url : `${API_BASE}${n.file_url}`)} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-accent transition-colors" title="View Attachment">
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    <a href={whatsappShare(n)} target="_blank" rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-success transition-colors" title="Share on WhatsApp">
                      <Share2 className="w-4 h-4" />
                    </a>
                    <button onClick={() => openEdit(n)}
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm(`Delete "${n.title}"?`)) deleteMutation.mutate(n.id); }}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{editing ? "Edit Notice" : "New Notice"}</h3>
              <button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Notice title" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Notice["type"] })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="general">General</option>
                  <option value="important">Important</option>
                  <option value="alert">Alert</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Content</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={4} placeholder="Notice details..."
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Attachment (PDF/Image)</label>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-input rounded-lg p-6 cursor-pointer hover:border-accent/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{file ? file.name : "Click to upload"}</span>
                  <span className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
                <Button type="submit" variant="accent" className="flex-1" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default NoticeManagement;
