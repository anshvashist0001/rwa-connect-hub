import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-primary text-primary-foreground">
    <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <h3 className="text-2xl font-bold mb-3">
            RWA <span className="text-accent">Shyam Kunj</span>
          </h3>
          <p className="text-primary-foreground/70 max-w-sm text-sm leading-relaxed">
            Building a better community together. Your Residents Welfare Association management platform.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-primary-foreground/50">Quick Links</h4>
          <div className="space-y-2">
            {[
              { to: "/notices", label: "Notices" },
              { to: "/events", label: "Events" },
              { to: "/gallery", label: "Gallery" },
              { to: "/payments", label: "Pay Dues" },
            ].map((l) => (
              <Link key={l.to} to={l.to} className="block text-sm text-primary-foreground/70 hover:text-accent transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-primary-foreground/50">Contact</h4>
          <div className="space-y-2 text-sm text-primary-foreground/70">
            <p>RWA Shyam Kunj</p>
            <p>Sector 42, Gurgaon</p>
            <p>rwa@shyamkunj.com</p>
          </div>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-primary-foreground/40">
        <span>© {new Date().getFullYear()} RWA Shyam Kunj. All rights reserved.</span>
        <Link to="/admin/login" className="hover:text-accent transition-colors">
          Admin Login →
        </Link>
      </div>
    </div>
  </footer>
);

export default Footer;
