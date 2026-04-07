import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, CreditCard, Bell, CalendarDays, Users,
  Home, BarChart2, LogOut, Menu, X, ChevronRight, ShieldCheck, IndianRupee, Image
} from "lucide-react";

const navItems = [
  { to: "/admin/dashboard",    icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/payments",     icon: CreditCard,      label: "Payments" },
  { to: "/admin/notices",      icon: Bell,            label: "Notices" },
  { to: "/admin/events",       icon: CalendarDays,    label: "Events" },
  { to: "/admin/gallery",      icon: Image,           label: "Gallery" },
  { to: "/admin/committee",    icon: ShieldCheck,     label: "Committee" },
  { to: "/admin/members",      icon: Users,           label: "Members" },
  { to: "/admin/houses",       icon: Home,            label: "Houses" },
  { to: "/admin/reports",      icon: BarChart2,       label: "Reports" },
  { to: "/admin/fee-settings", icon: IndianRupee,     label: "Fee Settings" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const admin = JSON.parse(localStorage.getItem("rwa_admin") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("rwa_admin_token");
    localStorage.removeItem("rwa_admin");
    navigate("/admin/login");
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-border">
        <Link to="/" className="font-serif text-xl font-bold">
          RWA <span className="text-accent">Shyam Kunj</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
            {admin.name?.charAt(0) || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{admin.name || "Admin"}</p>
            <p className="text-xs text-muted-foreground capitalize">{admin.role || "admin"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-destructive transition-colors w-full px-3 py-2 rounded-lg hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border bg-card flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-card border-r border-border flex flex-col">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-4 gap-3 bg-card/50 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg hover:bg-secondary"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold text-muted-foreground">
            {navItems.find((n) => n.to === location.pathname)?.label || "Admin"}
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
