import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { logsApi, type AdminLog } from "@/lib/api";
import { format } from "date-fns";
import { ScrollText } from "lucide-react";

const actionColor = (action: string) => {
  if (action.includes("DELETE")) return "bg-destructive/10 text-destructive";
  if (action.includes("APPROVE") || action.includes("CREATE") || action.includes("ADD")) return "bg-success/10 text-success";
  if (action.includes("REJECT")) return "bg-warning/10 text-warning";
  return "bg-secondary text-muted-foreground";
};

const AdminLogs = () => {
  const mockLogs: AdminLog[] = [
    { id: 1, admin_id: 1, admin_name: "RWA Administrator", username: "admin", action: "PAYMENT_APPROVED", entity_type: "payment", entity_id: 2, details: { name: "Sunita Sharma", amount: "2500" }, created_at: new Date().toISOString() },
    { id: 2, admin_id: 1, admin_name: "RWA Administrator", username: "admin", action: "CREATE_NOTICE", entity_type: "notice", entity_id: 1, details: { title: "Water Supply Maintenance" }, created_at: new Date().toISOString() },
    { id: 3, admin_id: 1, admin_name: "RWA Administrator", username: "admin", action: "ADD_MEMBER", entity_type: "member", entity_id: 1, details: { name: "Ramesh Kumar", block: "A", house_no: "101" }, created_at: new Date().toISOString() },
    { id: 4, admin_id: 1, admin_name: "RWA Administrator", username: "admin", action: "PAYMENT_REJECTED", entity_type: "payment", entity_id: 3, details: { name: "Vikram Singh", remarks: "Blurry screenshot" }, created_at: new Date().toISOString() },
  ];

  const { data: logs = mockLogs, isLoading } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: () => logsApi.getAll({ }),
    placeholderData: mockLogs,
  });

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold">Audit Logs</h2>
        </div>
        <p className="text-sm text-muted-foreground">All administrative actions are recorded here.</p>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm animate-pulse">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No activity logged yet.</div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    {["Action", "Entity", "Admin", "Details", "Date & Time"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logs.map((log: AdminLog) => (
                    <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${actionColor(log.action)}`}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs capitalize">
                        {log.entity_type ? `${log.entity_type} #${log.entity_id}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium">{log.admin_name}</p>
                        <p className="text-xs text-muted-foreground">{log.username}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs">
                        {log.details
                          ? Object.entries(log.details)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.created_at), 'dd MMM yyyy, hh:mm a')}
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

export default AdminLogs;
