import { MapPin, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { eventsApi, type Event } from "@/lib/api";
import { format } from "date-fns";

const EventsPreview = () => {
  const { data: events = [] } = useQuery({
    queryKey: ["events-preview"],
    queryFn: () => eventsApi.getAll({ upcoming: "true" }),
    select: (data) => data.slice(0, 3),
  });

  return (
    <section className="py-16 md:py-24 bg-secondary">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">What's Happening</p>
            <h2 className="text-3xl md:text-4xl font-bold">Upcoming Events</h2>
          </div>
          <Link to="/events" className="hidden md:flex items-center gap-2 text-sm font-medium text-accent hover:underline">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((event: Event) => {
            const date = new Date(event.event_date);
            return (
              <div
                key={event.id}
                className="group bg-background rounded-lg border border-border p-6 hover:shadow-lg hover:border-accent/30 transition-all duration-300 cursor-pointer"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-accent/10 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold uppercase text-accent">{format(date, 'MMM')}</span>
                    <span className="text-xl font-bold text-accent leading-none">{format(date, 'dd')}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg font-semibold mb-2 group-hover:text-accent transition-colors">{event.title}</h3>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {event.start_time && <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {event.start_time}</p>}
                      {event.location && <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {event.location}</p>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Skeleton placeholders when loading */}
          {events.length === 0 && [1, 2, 3].map((i) => (
            <div key={i} className="bg-background rounded-lg border border-border p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-lg bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-3/4" />
                  <div className="h-3 bg-secondary rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EventsPreview;
