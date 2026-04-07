import { ArrowRight, FileText, AlertTriangle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { noticesApi, type Notice } from "@/lib/api";

const typeIcon = {
  alert: <AlertTriangle className="w-4 h-4 text-warning" />,
  important: <FileText className="w-4 h-4 text-accent" />,
  general: <Info className="w-4 h-4 text-muted-foreground" />,
};

const NoticesPreview = () => {
  const { data: notices = [] } = useQuery({
    queryKey: ["notices-preview"],
    queryFn: () => noticesApi.getAll({ }),
    select: (data) => data.slice(0, 3),
  });

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Stay Informed</p>
            <h2 className="text-3xl md:text-4xl font-bold">Latest Notices</h2>
          </div>
          <Link to="/notices" className="hidden md:flex items-center gap-2 text-sm font-medium text-accent hover:underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {notices.map((notice: Notice) => (
            <div
              key={notice.id}
              className="group bg-card rounded-lg border border-border p-6 hover:shadow-lg hover:border-accent/30 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                {typeIcon[notice.type as keyof typeof typeIcon] || typeIcon.general}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{notice.type}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(notice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h3 className="font-serif text-lg font-semibold mb-2 group-hover:text-accent transition-colors">{notice.title}</h3>
              {notice.content && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{notice.content}</p>
              )}
            </div>
          ))}

          {/* Skeleton placeholders when loading */}
          {notices.length === 0 && [1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg border border-border p-6 animate-pulse">
              <div className="h-3 bg-secondary rounded w-1/4 mb-3" />
              <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
              <div className="h-3 bg-secondary rounded w-full" />
            </div>
          ))}
        </div>

        <Link to="/notices" className="md:hidden flex items-center justify-center gap-2 mt-8 text-sm font-medium text-accent">
          View all notices <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
};

export default NoticesPreview;
