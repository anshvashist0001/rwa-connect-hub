import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { eventsApi, type Event } from "@/lib/api";
import { demoEvents } from "@/lib/demoStore";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Share2, MapPin, Clock, X, Upload, Eye } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const emptyForm = {
  title: "", description: "", event_date: "", start_time: "", end_time: "", location: "",
};

const EventManagement = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [brochure, setBrochure] = useState<File | null>(null);

  const { data: events = demoEvents.getAll(), isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: () => eventsApi.getAll(),
    placeholderData: demoEvents.getAll(),
  });

  const syncPublic = (items: Event[]) => {
    qc.setQueryData(["events"], items);
    qc.invalidateQueries({ queryKey: ["events"] });
  };

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing ? eventsApi.update(editing.id, data) : eventsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success(editing ? "Event updated" : "Event created");
      closeForm();
    },
    onError: () => {
      let brochureUrl = editing?.brochure_url || null;
      let brochureName = editing?.brochure_name || null;
      if (brochure) {
        brochureUrl = URL.createObjectURL(brochure);
        brochureName = brochure.name;
      }

      if (editing) {
        demoEvents.update(editing.id, { ...form, brochure_url: brochureUrl, brochure_name: brochureName });
        toast.success("Event updated");
      } else {
        demoEvents.create({ ...form, brochure_url: brochureUrl, brochure_name: brochureName, is_active: true });
        toast.success("Event created");
      }
      const updated = demoEvents.getAll();
      qc.setQueryData(["admin-events"], updated);
      syncPublic(updated);
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: eventsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      qc.invalidateQueries({ queryKey: ["events"] });
      toast.success("Event deleted");
    },
    onError: (_, id) => {
      demoEvents.delete(id);
      const updated = demoEvents.getAll();
      qc.setQueryData(["admin-events"], updated);
      syncPublic(updated);
      toast.success("Event deleted");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (brochure) fd.append("brochure", brochure);
    saveMutation.mutate(fd);
  };

  const openEdit = (ev: Event) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      description: ev.description || "",
      event_date: ev.event_date.split("T")[0],
      start_time: ev.start_time || "",
      end_time: ev.end_time || "",
      location: ev.location || "",
    });
    setBrochure(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setBrochure(null);
  };

  const whatsappShare = (ev: Event) => {
    const dateStr = format(new Date(ev.event_date), 'dd MMM yyyy');
    const msg = `🎉 *${ev.title}*\n📅 ${dateStr}${ev.start_time ? ` at ${ev.start_time}` : ''}${ev.end_time ? ` - ${ev.end_time}` : ''}\n📍 ${ev.location || ''}\n\n${ev.description || ''}\n\n— RWA Shyam Kunj`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Events</h2>
          <Button onClick={() => setShowForm(true)} variant="accent" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Event
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm animate-pulse">Loading...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No events yet.</div>
        ) : (
          <div className="space-y-3">
            {events.map((ev) => {
              const date = new Date(ev.event_date);
              return (
                <div key={ev.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-accent/10 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase text-accent">{format(date, 'MMM')}</span>
                    <span className="text-xl font-bold text-accent leading-none">{format(date, 'dd')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{ev.title}</h3>
                    {ev.description && <p className="text-xs text-muted-foreground line-clamp-1">{ev.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                      {(ev.start_time || ev.end_time) && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ev.start_time}{ev.end_time ? ` - ${ev.end_time}` : ''}
                        </span>
                      )}
                      {ev.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{ev.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {ev.brochure_url && ev.brochure_url !== "null" && (
                      <a href={ev.brochure_url.startsWith("http") ? ev.brochure_url : (ev.brochure_url.startsWith("blob:") || ev.brochure_url.startsWith("data:") ? ev.brochure_url : `${API_BASE}${ev.brochure_url}`)} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-accent transition-colors" title="View Brochure">
                        <Eye className="w-4 h-4" />
                      </a>
                    )}
                    <a
                      href={whatsappShare(ev)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-success transition-colors"
                      title="Share on WhatsApp"
                    >
                      <Share2 className="w-4 h-4" />
                    </a>
                    <button onClick={() => openEdit(ev)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${ev.title}"?`)) deleteMutation.mutate(ev.id); }}
                      className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
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
              <h3 className="font-semibold">{editing ? "Edit Event" : "New Event"}</h3>
              <button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Event title" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Date *</label>
                <input required type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Start Time</label>
                  <input type="text" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="10:00 AM" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">End Time</label>
                  <input type="text" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="12:00 PM" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Location</label>
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Community Hall" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Event details..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Brochure (PDF/Image)</label>
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-input rounded-lg p-4 cursor-pointer hover:border-accent/50 transition-colors">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{brochure ? brochure.name : "Click to upload"}</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setBrochure(e.target.files?.[0] || null)} />
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

export default EventManagement;
