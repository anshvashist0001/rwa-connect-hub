import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { reportsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Clock, IndianRupee, Download, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const statusClass: Record<string, string> = {
  approved: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  rejected: "bg-destructive/10 text-destructive",
};
import { demoPayments } from "@/lib/demoStore";

const Reports = () => {
  const [filters, setFilters] = useState({ from: "", to: "", status: "all", block: "", house_no: "", name: "" });
  const [applied, setApplied] = useState(filters);

  const { data, isLoading } = useQuery({
    queryKey: ["reports-payments", applied],
    queryFn: async () => {
      try {
        const res = await reportsApi.payments({
          from: applied.from || undefined,
          to: applied.to || undefined,
          status: applied.status !== "all" ? applied.status : undefined,
          block: applied.block || undefined,
          house_no: applied.house_no || undefined,
          name: applied.name || undefined,
        });
        if (res && res.payments && res.payments.length > 0) return res;
        throw new Error("Empty or failed");
      } catch (err) {
        let filtered = demoPayments.getAll();
        if (applied.from) filtered = filtered.filter(p => p.created_at >= applied.from!);
        if (applied.to) filtered = filtered.filter(p => p.created_at <= applied.to! + 'T23:59:59Z');
        if (applied.status !== "all") filtered = filtered.filter(p => p.status === applied.status);
        if (applied.block) filtered = filtered.filter(p => p.block.toLowerCase().includes(applied.block.toLowerCase()));
        if (applied.house_no) filtered = filtered.filter(p => p.house_no.toLowerCase().includes(applied.house_no.toLowerCase()));
        if (applied.name) filtered = filtered.filter(p => p.name.toLowerCase().includes(applied.name.toLowerCase()));

        return {
          payments: filtered as never,
          summary: {
            total: filtered.length,
            approved: filtered.filter(p => p.status === "approved").length,
            pending:  filtered.filter(p => p.status === "pending").length,
            rejected: filtered.filter(p => p.status === "rejected").length,
            totalCollected: filtered.filter(p => p.status === "approved").reduce((s, p) => s + parseFloat(p.amount), 0),
          },
        };
      }
    },
    placeholderData: (previousData) => previousData,
  });

  const exportCSV = () => {
    if (!data?.payments.length) return;
    const headers = ["ID", "Name", "Phone", "Block", "House No", "Amount", "Type", "Status", "Remarks", "Date", "Verified By"];
    const rows = data.payments.map((p) => [
      p.id, p.name, p.phone, p.block, p.house_no, p.amount, p.payment_type,
      p.status, p.remarks || "", format(new Date(p.created_at), 'dd-MM-yyyy'),
      (p as any).verified_by_name || "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-report-${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Payment Reports</h2>
          <div className="flex items-center gap-2">
            <Link to="/admin/payments">
              <Button variant="outline" size="sm" className="gap-2">
                Approve / Reject <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button onClick={exportCSV} variant="accent" size="sm" className="gap-2" disabled={!data?.payments.length}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-start gap-3">
          <Clock className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">How this works</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Residents submit payments → Go to <Link to="/admin/payments" className="text-accent underline underline-offset-2">Payment Management</Link> to review &amp; approve/reject → Approved payments appear in this report with total collected amount.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">From Date</label>
            <input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">To Date</label>
            <input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Block</label>
            <input value={filters.block} onChange={(e) => setFilters({ ...filters, block: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. A" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">House No.</label>
            <input value={filters.house_no} onChange={(e) => setFilters({ ...filters, house_no: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. 101" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
            <input value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Resident Name" />
          </div>
          <div className="col-span-full flex justify-end">
            <Button onClick={() => setApplied(filters)} variant="accent" size="sm">Apply Filters</Button>
          </div>
        </div>

        {/* Summary */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <p className="text-2xl font-bold">{data.summary.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <CheckCircle className="w-5 h-5 text-success mx-auto mb-1" />
              <p className="text-2xl font-bold">{data.summary.approved}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 text-warning mx-auto mb-1" />
              <p className="text-2xl font-bold">{data.summary.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <IndianRupee className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-2xl font-bold">₹{data.summary.totalCollected.toLocaleString('en-IN')}</p>
              <p className="text-xs text-muted-foreground">Collected</p>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm animate-pulse">Loading...</div>
        ) : !data?.payments.length ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No records found for the selected filters.</div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    {["Name", "House", "Phone", "Amount", "Type", "Status", "Date", "Verified By"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.payments.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.block}-{p.house_no}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.phone}</td>
                      <td className="px-4 py-3 font-semibold">₹{parseFloat(p.amount).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{p.payment_type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusClass[p.status]}`}>{p.status}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                        {format(new Date(p.created_at), 'dd MMM yy')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {((p as any).verified_by_name as string) || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Reports;
