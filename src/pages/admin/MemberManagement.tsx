import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { membersApi, type Member } from "@/lib/api";
import { demoMembers } from "@/lib/demoStore";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, Upload, X, UserCircle } from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const emptyForm = { name: "", phone: "", block: "", house_no: "", email: "" };

const MemberManagement = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState<File | null>(null);

  const { data: members = demoMembers.getAll(), isLoading } = useQuery({
    queryKey: ["admin-members", search],
    queryFn: async () => {
      try {
        const res = await membersApi.getAll(search || undefined);
        return res.length > 0 ? res : demoMembers.getAll();
      } catch {
        return demoMembers.getAll();
      }
    },
    placeholderData: demoMembers.getAll(),
  });

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      editing ? membersApi.update(editing.id, data) : membersApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-members"] });
      toast.success(editing ? "Member updated" : "Member added");
      closeForm();
    },
    onError: () => {
      toast.success(editing ? "Member updated (demo)" : "Member added (demo)");
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: membersApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-members"] });
      toast.success("Member removed");
    },
    onError: () => toast.success("Member removed (demo)"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (photo) fd.append("photo", photo);
    saveMutation.mutate(fd);
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({ name: m.name, phone: m.phone, block: m.block, house_no: m.house_no, email: m.email || "" });
    setPhoto(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setPhoto(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Members</h2>
          <Button onClick={() => setShowForm(true)} variant="accent" size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, phone, block, house..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm animate-pulse">Loading...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No members found.</div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    {["Member", "House", "Phone", "Email", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {m.photo_url ? (
                            <img src={`${API_BASE}${m.photo_url}`} alt={m.name}
                              className="w-8 h-8 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                              <UserCircle className="w-5 h-5 text-accent" />
                            </div>
                          )}
                          <span className="font-medium">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{m.block}-{m.house_no}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.email || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${m.is_active ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
                          {m.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Remove ${m.name}?`)) deleteMutation.mutate(m.id); }}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">{editing ? "Edit Member" : "Add Member"}</h3>
              <button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Resident name" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Phone *</label>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="9876543210" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Block *</label>
                  <input required value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. A" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">House No. *</label>
                  <input required value={form.house_no} onChange={(e) => setForm({ ...form, house_no: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="e.g. 101" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="resident@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Photo</label>
                <label className="flex items-center gap-3 border border-input rounded-lg p-3 cursor-pointer hover:border-accent/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{photo ? photo.name : "Upload photo (JPG, PNG)"}</span>
                  <input type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={closeForm}>Cancel</Button>
                <Button type="submit" variant="accent" className="flex-1" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default MemberManagement;
