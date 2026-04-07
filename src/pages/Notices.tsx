import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, AlertTriangle, Info, Search, ExternalLink } from "lucide-react";
import { noticesApi, type Notice } from "@/lib/api";
import { demoNotices } from "@/lib/demoStore";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const typeConfig = {
  alert: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  important: { icon: FileText, color: "text-accent", bg: "bg-accent/10" },
  general: { icon: Info, color: "text-muted-foreground", bg: "bg-muted" },
};

const Notices = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const { data: notices = demoNotices.getAll(), isLoading } = useQuery({
    queryKey: ["notices", filter],
    queryFn: async () => {
      try {
        const result = await noticesApi.getAll({ type: filter !== "all" ? filter : undefined });
        return result.length > 0 ? result : demoNotices.getAll().filter((n) => filter === "all" || n.type === filter);
      } catch {
        return demoNotices.getAll().filter((n) => filter === "all" || n.type === filter);
      }
    },
    placeholderData: demoNotices.getAll(),
  });

  const filtered = notices.filter((n: Notice) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.content || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-10">
            <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Announcements</p>
            <h1 className="text-3xl md:text-5xl font-bold">Notices</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search notices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              {["all", "alert", "important", "general"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-2 rounded-full text-xs font-medium capitalize transition-colors ${
                    filter === t ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse">
                  <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                  <div className="h-3 bg-secondary rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {search ? "No notices match your search." : "No notices available."}
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((notice: Notice) => {
                const config = typeConfig[notice.type as keyof typeof typeConfig] || typeConfig.general;
                const Icon = config.icon;
                return (
                  <div key={notice.id} className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="font-serif text-lg font-semibold">{notice.title}</h3>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>{notice.type}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {notice.content && (
                          <p className="text-sm text-muted-foreground leading-relaxed">{notice.content}</p>
                        )}
                        {notice.file_url && (
                          <a
                            href={notice.file_url.startsWith("http") ? notice.file_url : (notice.file_url.startsWith("blob:") || notice.file_url.startsWith("data:") ? notice.file_url : `${API_BASE}${notice.file_url}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-accent hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> View Attachment ({notice.file_size})
                          </a>
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
      <Footer />
    </div>
  );
};

export default Notices;
