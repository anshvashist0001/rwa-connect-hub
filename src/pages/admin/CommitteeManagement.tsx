import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { committeeApi, type CommitteeMember } from "@/lib/api";
import { demoCommittee } from "@/lib/demoStore";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Upload, X, UserCircle, GripVertical } from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const DESIGNATIONS = [
  "President", "Vice President", "Secretary", "Joint Secretary",
  "Treasurer", "Joint Treasurer", "Member", "Advisor",
];

const emptyForm = {
  name: "", designation: "Member", phone: "", email: "", bio: "", display_order: "99",
};

const CommitteeManagement = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CommitteeMember | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState<File | null>(null);

  const syncPublic = (items: CommitteeMember[]) => {
    qc.setQueryData(["committee"], items);
    qc.setQueryData(["admin-committee"], items);
    qc.invalidateQueries({ queryKey: ["committee"] });
  };

  const { data: committee = demoCommittee.getAll(), isLoading } = useQuery({
    queryKey: ["admin-committee"],
    queryFn: committeeApi.getAll,
    placeholderData: demoCommittee.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: (fd: FormData) =>
      editing ? committeeApi.update(editing.id, fd) : committeeApi.create(fd),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-committee"] });
      qc.invalidateQueries({ queryKey: ["committee"] });
      toast.success(editing ? "Member updated" : "Member added");
      closeForm();
    },
    onError: () => {
      // Demo mode
      let photoUrl = null;
      if (photo) photoUrl = URL.createObjectURL(photo);

      if (editing) {
        demoCommittee.update(editing.id, {
          name: form.name,
          designation: form.designation,
          phone: form.phone,
          email: form.email,
          bio: form.bio,
          display_order: parseInt(form.display_order),
          ...(photoUrl && { photo_url: photoUrl })
        });
        toast.success("Member updated (Local Mode)");
      } else {
        demoCommittee.create({
          name: form.name,
          designation: form.designation,
          phone: form.phone,
          email: form.email,
          bio: form.bio,
          display_order: parseInt(form.display_order),
          photo_url: photoUrl,
          is_active: true
        });
        toast.success("Member added (Local Mode)");
      }

      const updated = demoCommittee.getAll();
      syncPublic(updated);
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: committeeApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-committee"] });
      qc.invalidateQueries({ queryKey: ["committee"] });
      toast.success("Member removed");
    },
    onError: (_, id) => {
      demoCommittee.delete(id);
      const updated = demoCommittee.getAll();
      syncPublic(updated);
      toast.success("Member removed (Local Mode)");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (photo) fd.append("photo", photo);
    saveMutation.mutate(fd);
  };

  const openEdit = (m: CommitteeMember) => {
    setEditing(m);
    setForm({
      name: m.name,
      designation: m.designation,
      phone: m.phone || "",
      email: m.email || "",
      bio: m.bio || "",
      display_order: m.display_order?.toString() || "99",
    });
    setPhoto(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setPhoto(null);
  };

  const sorted = [...committee].sort((a, b) => (a.display_order || 99) - (b.display_order || 99));

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Committee Members</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage the RWA committee displayed on the public website</p>
          </div>
          <Button onClick={() => setShowForm(true)} variant="accent" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm animate-pulse">Loading...</div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No committee members added yet.</div>
        ) : (
          <div className="space-y-3">
            {sorted.map((m) => (
              <div key={m.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <GripVertical className="w-4 h-4 text-muted-foreground/40 flex-shrink-0 cursor-grab" />

                {/* Photo */}
                {m.photo_url ? (
                  <img
                    src={`${API_BASE}${m.photo_url}`}
                    alt={m.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-border flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <UserCircle className="w-7 h-7 text-accent/60" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-sm">{m.name}</h3>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent/10 text-accent flex-shrink-0">
                      {m.designation}
                    </span>
                    {!m.is_active && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        Hidden
                      </span>
                    )}
                  </div>
                  {m.bio && <p className="text-xs text-muted-foreground truncate">{m.bio}</p>}
                  <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                    {m.phone && <span>{m.phone}</span>}
                    {m.email && <span className="truncate">{m.email}</span>}
                  </div>
                </div>

                {/* Order badge */}
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-muted-foreground">{m.display_order}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(m)}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${m.name} from the committee?`)) deleteMutation.mutate(m.id);
                    }}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{editing ? "Edit Committee Member" : "Add Committee Member"}</h3>
              <button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="e.g. Rajesh Gupta"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Designation *</label>
                <select
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {DESIGNATIONS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="9876500001"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Display Order</label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="president@shyamkunj.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Bio / Role Description</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Brief description of their role..."
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Photo</label>
                <label className="flex items-center gap-3 border border-input rounded-lg p-3 cursor-pointer hover:border-accent/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{photo ? photo.name : "Upload photo (JPG, PNG)"}</span>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
                <Button type="submit" variant="accent" className="flex-1" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Add Member"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CommitteeManagement;
