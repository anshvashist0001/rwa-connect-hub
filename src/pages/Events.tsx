import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Calendar, MapPin, Clock, ExternalLink } from "lucide-react";
import { eventsApi, type Event } from "@/lib/api";
import { demoEvents } from "@/lib/demoStore";
import { format } from "date-fns";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const Events = () => {
  const { data: events = demoEvents.getAll(), isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      try {
        const result = await eventsApi.getAll({ upcoming: "true" });
        return result.length > 0 ? result : demoEvents.getAll();
      } catch {
        return demoEvents.getAll();
      }
    },
    placeholderData: demoEvents.getAll(),
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-10">
            <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Community</p>
            <h1 className="text-3xl md:text-5xl font-bold">Upcoming Events</h1>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="bg-card rounded-lg border border-border overflow-hidden animate-pulse">
                  <div className="flex">
                    <div className="w-24 bg-secondary" />
                    <div className="p-6 flex-1 space-y-2">
                      <div className="h-4 bg-secondary rounded w-3/4" />
                      <div className="h-3 bg-secondary rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No upcoming events at this time.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map((event: Event) => {
                const date = new Date(event.event_date);
                return (
                  <div key={event.id} className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="flex">
                      <div className="flex-shrink-0 w-24 bg-accent/10 flex flex-col items-center justify-center p-4">
                        <span className="text-xs font-bold uppercase text-accent">{format(date, 'MMM')}</span>
                        <span className="text-3xl font-bold text-accent">{format(date, 'dd')}</span>
                      </div>
                      <div className="p-6 flex-1">
                        <h3 className="font-serif text-xl font-semibold mb-2 group-hover:text-accent transition-colors">{event.title}</h3>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mb-3">{event.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {(event.start_time || event.end_time) && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.start_time}{event.end_time ? ` - ${event.end_time}` : ''}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {event.location}
                            </span>
                          )}
                        </div>
                        {event.brochure_url && event.brochure_url !== "null" && (
                          <a
                            href={event.brochure_url.startsWith("http") ? event.brochure_url : (event.brochure_url.startsWith("blob:") || event.brochure_url.startsWith("data:") ? event.brochure_url : `${API_BASE}${event.brochure_url}`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-accent hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> View Brochure
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

export default Events;
