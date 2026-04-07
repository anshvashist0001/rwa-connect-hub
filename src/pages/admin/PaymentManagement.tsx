import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { paymentsApi, type Payment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, Search, Eye, MessageCircle, X, Pencil, Download, Plus, Trash2 } from "lucide-react";
import { getFees } from "@/lib/feeConfig";
import { format } from "date-fns";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const statusIcon = {
  approved: <CheckCircle className="w-4 h-4 text-success" />,
  pending: <Clock className="w-4 h-4 text-warning" />,
  rejected: <XCircle className="w-4 h-4 text-destructive" />,
};

const statusClass = {
  approved: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  rejected: "bg-destructive/10 text-destructive",
};

const PaymentManagement = () => {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Payment | null>(null);
  const [remarks, setRemarks] = useState("");
  const [editStatus, setEditStatus] = useState<string>("");

  const { data: fetchedPayments, isLoading } = useQuery({
    queryKey: ["admin-payments", filter, search],
    queryFn: async () => {
      try {
        const result = await paymentsApi.getAll({ status: filter !== "all" ? filter : undefined, search: search || undefined });
        return result;
      } catch {
        const { demoPayments } = await import("@/lib/demoStore");
        let all = demoPayments.getAll();
        if (filter !== "all") all = all.filter(p => p.status === filter);
        if (search) all = all.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search) || p.block.toLowerCase().includes(search.toLowerCase()) || p.house_no.toLowerCase().includes(search.toLowerCase()));
        return all;
      }
    },
  });

  const payments = fetchedPayments || [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, remarks }: { id: number; status: string; remarks?: string }) => {
      try {
        return await paymentsApi.updateStatus(id, status, remarks);
      } catch {
        const { demoPayments } = await import("@/lib/demoStore");
        return demoPayments.updateStatus(id, status as Payment["status"], remarks);
      }
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["payment-status"] });
      toast.success(`Payment ${updated.status}`);
    },
  });

  const handleAction = (status: "approved" | "rejected") => {
    if (!selected) return;
    setSelected(null);
    updateMutation.mutate({ id: selected.id, status, remarks });
  };

  const handleEditSave = () => {
    if (!selected || !editStatus) return;
    updateMutation.mutate({ id: selected.id, status: editStatus, remarks });
    setSelected(null);
    setEditStatus("");
  };

  const whatsappMessage = (p: Payment) => {
    const msg = `Dear ${p.name}, your payment of ₹${parseFloat(p.amount).toLocaleString('en-IN')} for ${p.payment_type} has been *${p.status.toUpperCase()}* by RWA Shyam Kunj.${p.remarks ? ` Remarks: ${p.remarks}` : ''} Thank you.`;
    return `https://wa.me/91${p.phone}?text=${encodeURIComponent(msg)}`;
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", block: "", house_no: "", amount: "", payment_type: getFees()[0]?.label || "Maintenance Fee" });

  const adminSubmitMutation = useMutation({
    mutationFn: async (fd: FormData) => {
      try {
        const res = await paymentsApi.submit(fd);
        return await paymentsApi.updateStatus(res.payment.id, "approved", "Admin logged payment offline");
      } catch {
        const { demoPayments } = await import("@/lib/demoStore");
        return demoPayments.create({
          name: fd.get("name") as string,
          phone: fd.get("phone") as string,
          block: fd.get("block") as string,
          house_no: fd.get("house_no") as string,
          amount: fd.get("amount") as string,
          payment_type: fd.get("payment_type") as string,
          status: "approved",
          remarks: "Admin logged payment offline",
          screenshot_url: null
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment added and approved successfully");
      setShowAddForm(false);
      setAddForm({ name: "", phone: "", block: "", house_no: "", amount: "", payment_type: getFees()[0]?.label || "Maintenance Fee" });
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(addForm).forEach(([k, v]) => fd.append(k, v));
    adminSubmitMutation.mutate(fd);
  };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Phone,Block,House No,Amount,Type,Date,Status\n";
    payments.forEach((p) => {
      const row = [
        p.id,
        `"${p.name}"`,
        p.phone,
        `"${p.block}"`,
        `"${p.house_no}"`,
        p.amount,
        `"${p.payment_type}"`,
        `"${format(new Date(p.created_at), 'yyyy-MM-dd HH:mm')}"`,
        p.status
      ].join(",");
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payments_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await paymentsApi.delete(id);
      } catch {
        const { demoPayments } = await import("@/lib/demoStore");
        const all = demoPayments.getAll().filter(p => p.id !== id);
        localStorage.setItem("demo_payments", JSON.stringify(all));
        return { success: true };
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Payment deleted");
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold">Payment Management</h2>
          <div className="flex items-center gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm" className="gap-2 hidden sm:flex">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button onClick={() => setShowAddForm(true)} variant="accent" size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Add Payment
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, phone, block, house..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === s ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm animate-pulse">Loading...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No payments found</div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    {["Name", "House", "Phone", "Amount", "Type", "Date", "Status", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.block}-{p.house_no}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.phone}</td>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.payment_type}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {format(new Date(p.created_at), 'dd MMM yy')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusClass[p.status]}`}>
                          {statusIcon[p.status]} {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelected(p); setRemarks(p.remarks || ""); setEditStatus(""); }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              p.status === "pending"
                                ? "bg-accent text-accent-foreground hover:bg-accent/90"
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                            }`}
                            title="View"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            {p.status === "pending" ? "Review" : "View"}
                          </button>
                          <button
                            onClick={() => { setSelected(p); setRemarks(p.remarks || ""); setEditStatus(p.status); }}
                            className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-accent"
                            title="Edit Status"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {p.status !== "pending" && (
                            <a
                              href={whatsappMessage(p)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-success"
                              title="Notify via WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => { if (confirm(`Delete payment from ${p.name}?`)) deleteMutation.mutate(p.id); }}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Review modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{editStatus ? "Edit Payment Status" : "Review Payment"}</h3>
              <button onClick={() => { setSelected(null); setEditStatus(""); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm mb-4">
              {[
                ["Name", selected.name],
                ["Phone", selected.phone],
                ["House", `${selected.block}-${selected.house_no}`],
                ["Amount", `₹${parseFloat(selected.amount).toLocaleString('en-IN')}`],
                ["Type", selected.payment_type],
                ["Submitted", format(new Date(selected.created_at), 'dd MMM yyyy, hh:mm a')],
                ["Status", <span className="capitalize font-medium">{selected.status}</span>],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>

            {selected.screenshot_url && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Payment Screenshot</p>
                {(() => {
                  const isExternal = selected.screenshot_url.startsWith("http");
                  const imgSrc = isExternal ? selected.screenshot_url : (selected.screenshot_url.startsWith("blob:") || selected.screenshot_url.startsWith("data:") ? selected.screenshot_url : `${API_BASE}${selected.screenshot_url}`);
                  const linkHref = isExternal ? selected.screenshot_url.replace('lh3.googleusercontent.com/d/', 'drive.google.com/file/d/').replace(/$/,'/view') : imgSrc;
                  return (
                    <a href={linkHref} target="_blank" rel="noopener noreferrer">
                      <img src={imgSrc} alt="Payment screenshot" className="w-full max-h-48 object-contain rounded-lg border border-border" />
                    </a>
                  );
                })()}
              </div>
            )}

            {editStatus ? (
              /* Edit mode: status dropdown + save */
              <>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-1.5 block">Change Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-1.5 block">Remarks (optional)</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Add remarks..."
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => { setSelected(null); setEditStatus(""); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditSave} disabled={updateMutation.isPending} variant="accent" className="flex-1">
                    Save Changes
                  </Button>
                </div>
              </>
            ) : (
              /* View / Review mode */
              <>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-1.5 block">Remarks (optional)</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    placeholder="Add remarks..."
                  />
                </div>
                {selected.status === "pending" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleAction("approved")}
                      disabled={updateMutation.isPending}
                      className="flex-1 bg-success hover:bg-success/90 text-white"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Approve
                    </Button>
                    <Button
                      onClick={() => handleAction("rejected")}
                      disabled={updateMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      {/* Add Payment modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Add Offline Payment</h3>
              <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                <input required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Phone *</label>
                  <input required type="tel" maxLength={10} value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value.replace(/\D/, "") })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Block *</label>
                  <input required value={addForm.block} onChange={(e) => setAddForm({ ...addForm, block: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">House No. *</label>
                  <input required value={addForm.house_no} onChange={(e) => setAddForm({ ...addForm, house_no: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Payment Type *</label>
                  <select required value={addForm.payment_type} onChange={(e) => setAddForm({ ...addForm, payment_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    {getFees().map(f => <option key={f.label} value={f.label}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Amount (₹) *</label>
                  <input required type="number" min="1" value={addForm.amount} onChange={(e) => setAddForm({ ...addForm, amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div className="bg-success/10 border border-success/20 p-3 rounded-lg flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <p className="text-xs text-success font-medium">This payment will be automatically marked as Approved.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddForm(false)}>Cancel</Button>
                <Button type="submit" variant="accent" className="flex-1" disabled={adminSubmitMutation.isPending}>
                  {adminSubmitMutation.isPending ? "Saving..." : "Save Payment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PaymentManagement;
