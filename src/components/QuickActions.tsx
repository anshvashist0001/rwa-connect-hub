import { CreditCard, FileText, CalendarDays, Users } from "lucide-react";
import { Link } from "react-router-dom";

const actions = [
  { icon: CreditCard, label: "Pay Membership", desc: "Submit your payment details", to: "/payments" },
  { icon: FileText, label: "View Notices", desc: "Latest announcements", to: "/notices" },
  { icon: CalendarDays, label: "Events", desc: "Community happenings", to: "/events" },
  { icon: Users, label: "Committee", desc: "Meet your representatives", to: "/committee" },
];

const QuickActions = () => (
  <section className="py-16 md:py-24 bg-background">
    <div className="container mx-auto px-4 md:px-8">
      <div className="text-center mb-12">
        <p className="text-accent text-sm font-semibold uppercase tracking-wider mb-2">Quick Access</p>
        <h2 className="text-3xl md:text-4xl font-bold">What would you like to do?</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="group bg-card rounded-lg border border-border p-6 text-center hover:shadow-lg hover:border-accent/30 transition-all duration-300"
          >
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/20 transition-colors">
              <action.icon className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-sm mb-1">{action.label}</h3>
            <p className="text-xs text-muted-foreground">{action.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

export default QuickActions;
