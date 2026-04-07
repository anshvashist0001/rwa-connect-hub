import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { dashboardApi, noticesApi, eventsApi, paymentsApi, membersApi } from "@/lib/api";
import { Users, CreditCard, Bell, CalendarDays, IndianRupee, Clock, CheckCircle, XCircle, MapPin } from "lucide-react";
import { format, isAfter } from "date-fns";
import { demoMembers, demoPayments, demoNotices, demoEvents } from "@/lib/demoStore";

const StatCard = ({ icon: Icon, label, value, sub, color = "text-accent" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-warning/10 text-warning",
    approved: "bg-success/10 text-success",
    rejected: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${map[status] || "bg-secondary"}`}>
      {status}
    </span>
  );
};

const AdminDashboard = () => {
  const { data, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: dashboardApi.get,
  });

  // Fetch real data from API with fallback to demoStore
  const { data: payments = [] } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      try { return await paymentsApi.getAll(); } catch { return demoPayments.getAll(); }
    },
    placeholderData: demoPayments.getAll(),
  });

  const { data: notices = [] } = useQuery({
    queryKey: ["admin-notices"],
    queryFn: async () => {
      try { return await noticesApi.getAll({}); } catch { return demoNotices.getAll(); }
    },
    placeholderData: demoNotices.getAll(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      try { return await eventsApi.getAll({}); } catch { return demoEvents.getAll(); }
    },
    placeholderData: demoEvents.getAll(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      try { return await membersApi.getAll(); } catch { return demoMembers.getAll(); }
    },
    placeholderData: demoMembers.getAll(),
  });

  // Compute live stats from fetched data
  const stats = data?.stats || {
    members: { total: members.length, active: members.filter(m => m.is_active).length },
    payments: {
      total: payments.length,
      pending: payments.filter(p => p.status === "pending").length,
      approved: payments.filter(p => p.status === "approved").length,
      rejected: payments.filter(p => p.status === "rejected").length,
      totalCollected: payments.filter(p => p.status === "approved").reduce((sum, p) => sum + parseInt(p.amount as string), 0),
    },
    notices: notices.length,
    upcomingEvents: events.filter(e => isAfter(new Date(e.event_date), new Date())).length,
  };

  const recentPayments = data?.recentPayments || payments.slice(0, 3).map(p => ({
    id: p.id, name: p.name, block: p.block, house_no: p.house_no, amount: p.amount, status: p.status, created_at: p.created_at
  }));

  const recentNotices = data?.recentNotices || notices.slice(0, 3).map(n => ({
    id: n.id, title: n.title, type: n.type, created_at: n.created_at
  }));

  const upcomingEvents = events
    .filter(e => isAfter(new Date(e.event_date), new Date()))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 3);

  const isLoading = dashLoading;

  if (isLoading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm animate-pulse">
        Loading dashboard...
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">Overview</h2>
          <p className="text-sm text-muted-foreground">Welcome back, {JSON.parse(localStorage.getItem("rwa_admin") || "{}").name}</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Members" value={stats.members.active} sub={`${stats.members.total} registered`} />
          <StatCard icon={Clock} label="Pending Payments" value={stats.payments.pending} color="text-warning" />
          <StatCard
            icon={IndianRupee}
            label="Total Collected"
            value={`₹${stats.payments.totalCollected.toLocaleString('en-IN')}`}
            sub={`${stats.payments.approved} approved`}
          />
          <StatCard icon={CalendarDays} label="Upcoming Events" value={stats.upcomingEvents} />
        </div>

        {/* Payment summary row */}
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <CheckCircle className="w-6 h-6 text-success mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.payments.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-warning mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.payments.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <XCircle className="w-6 h-6 text-destructive mx-auto mb-1" />
            <p className="text-lg font-bold">{stats.payments.rejected}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent payments */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-accent" /> Recent Payments
            </h3>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No payments yet</p>
            ) : (
              <div className="space-y-3">
                {recentPayments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.block}-{p.house_no} · {p.created_at ? format(new Date(p.created_at), 'dd MMM yyyy') : ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₹{parseFloat(p.amount as string).toLocaleString('en-IN')}</p>
                      {statusBadge(p.status as string)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent notices */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-accent" /> Recent Notices
            </h3>
            {recentNotices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No notices yet</p>
            ) : (
              <div className="space-y-3">
                {recentNotices.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mt-0.5 ${
                      n.type === 'alert' ? 'bg-warning/10 text-warning' :
                      n.type === 'important' ? 'bg-accent/10 text-accent' :
                      'bg-secondary text-muted-foreground'
                    }`}>{n.type}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.created_at ? format(new Date(n.created_at), 'dd MMM yyyy') : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-accent" /> Upcoming Events
          </h3>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingEvents.map((e) => {
                const date = new Date(e.event_date);
                return (
                  <div key={e.id} className="flex gap-3 p-3 rounded-lg border border-border hover:border-accent/30 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-accent/10 flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold uppercase text-accent">{format(date, 'MMM')}</span>
                      <span className="text-lg font-bold text-accent leading-none">{format(date, 'dd')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      <div className="space-y-0.5 mt-1">
                        {e.start_time && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {e.start_time}{e.end_time ? ` - ${e.end_time}` : ''}
                          </p>
                        )}
                        {e.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {e.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
