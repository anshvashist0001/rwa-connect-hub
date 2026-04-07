import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { housesApi, membersApi, type House } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, X, Home, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import { demoHouses, demoMembers } from "@/lib/demoStore";

const emptyForm = { house_no: "", block: "", floor: "", type: "", member_id: "" };

const HouseManagement = () => {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<House | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [search, setSearch] = useState("");
  const [filterBlock, setFilterBlock] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterFloor, setFilterFloor] = useState("");

  const { data: houses = demoHouses.getAll(), isLoading } = useQuery({
    queryKey: ["admin-houses"],
    queryFn: async () => {
      try {
        const res = await housesApi.getAll();
        return res.length > 0 ? res : demoHouses.getAll();
      } catch {
        return demoHouses.getAll();
      }
    },
    placeholderData: demoHouses.getAll(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      try {
        const res = await membersApi.getAll();
        return res.length > 0 ? res : demoMembers.getAll();
      } catch {
        return demoMembers.getAll();
      }
    },
  });

  // Extract unique values for filter dropdowns
  const uniqueBlocks = useMemo(() => [...new Set(houses.map((h: House) => h.block).filter(Boolean))].sort(), [houses]);
  const uniqueTypes = useMemo(() => [...new Set(houses.map((h: House) => h.type).filter(Boolean))].sort(), [houses]);
  const uniqueFloors = useMemo(() => [...new Set(houses.map((h: House) => h.floor).filter((f): f is number => f != null))].sort((a, b) => a - b), [houses]);

  const filteredHouses = houses.filter((h: House) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (h.house_no?.toLowerCase() || "").includes(q) ||
      (h.block?.toLowerCase() || "").includes(q) ||
      (h.member_name?.toLowerCase() || "").includes(q);
    const matchesBlock = !filterBlock || h.block === filterBlock;
    const matchesType = !filterType || h.type === filterType;
    const matchesFloor = !filterFloor || h.floor?.toString() === filterFloor;
    return matchesSearch && matchesBlock && matchesType && matchesFloor;
  });

  const hasActiveFilters = filterBlock || filterType || filterFloor;

  const clearFilters = () => {
    setFilterBlock("");
    setFilterType("");
    setFilterFloor("");
  };

  const saveMutation = useMutation({
    mutationFn: (data: Partial<House>) =>
      editing ? housesApi.update(editing.id, data) : housesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-houses"] });
      toast.success(editing ? "House updated" : "House added");
      closeForm();
    },
    onError: () => {
      toast.success(editing ? "House updated (demo)" : "House added (demo)");
      closeForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: housesApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-houses"] });
      toast.success("House removed");
    },
    onError: () => toast.success("House removed (demo)"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      house_no: form.house_no,
      block: form.block || undefined,
      floor: form.floor ? parseInt(form.floor) : undefined,
      type: form.type || undefined,
      member_id: form.member_id ? parseInt(form.member_id) : undefined,
    });
  };

  const openEdit = (h: House) => {
    setEditing(h);
    setForm({
      house_no: h.house_no,
      block: h.block || "",
      floor: h.floor?.toString() || "",
      type: h.type || "",
      member_id: h.member_id?.toString() || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Houses</h2>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by block, house no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-md border border-input bg-background text-sm"
              />
            </div>
            <Button onClick={() => setShowForm(true)} variant="accent" size="sm" className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Add House
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="w-4 h-4" /> Filters:
          </div>
          <select
            value={filterBlock}
            onChange={(e) => setFilterBlock(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
          >
            <option value="">All Blocks</option>
            {uniqueBlocks.map((b) => (
              <option key={b} value={b}>Block {b}</option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
          >
            <option value="">All Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={filterFloor}
            onChange={(e) => setFilterFloor(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-input bg-background text-sm"
          >
            <option value="">All Floors</option>
            {uniqueFloors.map((f) => (
              <option key={f} value={f.toString()}>Floor {f}</option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-accent hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">
            {filteredHouses.length} of {houses.length} houses
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm animate-pulse">Loading...</div>
        ) : filteredHouses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No houses found.</div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    {["House", "Block", "Floor", "Type", "Resident", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredHouses.map((h) => (
                    <tr key={h.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-accent" /> {h.block}-{h.house_no}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{h.block || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{h.floor ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{h.type || "—"}</td>
                      <td className="px-4 py-3">
                        {h.member_name ? (
                          <div>
                            <p className="font-medium">{h.member_name}</p>
                            <p className="text-xs text-muted-foreground">{h.member_phone}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(h)} className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm(`Remove house ${h.block}-${h.house_no}?`)) deleteMutation.mutate(h.id); }}
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
              <h3 className="font-semibold">{editing ? "Edit House" : "Add House"}</h3>
              <button onClick={closeForm}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">House No. *</label>
                <input required value={form.house_no} onChange={(e) => setForm({ ...form, house_no: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="101" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Block</label>
                  <input value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="A" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Floor</label>
                  <input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="1" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select type</option>
                  <option value="1BHK">1 BHK</option>
                  <option value="2BHK">2 BHK</option>
                  <option value="3BHK">3 BHK</option>
                  <option value="4BHK">4 BHK</option>
                  <option value="Penthouse">Penthouse</option>
                  <option value="Shop">Shop</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Assign Resident</label>
                <select value={form.member_id} onChange={(e) => setForm({ ...form, member_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} — {m.block}-{m.house_no}</option>
                  ))}
                </select>
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

export default HouseManagement;
