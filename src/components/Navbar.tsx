import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, MapPin, LayoutDashboard } from "lucide-react";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/notices", label: "Notices" },
  { to: "/events", label: "Events" },
  { to: "/gallery", label: "Gallery" },
  { to: "/committee", label: "Committee" },
  { to: "/payments", label: "Payments" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = !isHome || scrolled;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${solid ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"}`}>
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`md:hidden p-2 ${solid ? "text-foreground" : "text-primary-foreground"}`}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <Link to="/" className={`font-serif text-2xl md:text-3xl font-bold tracking-tight ${solid ? "text-foreground" : "text-primary-foreground"}`}>
            RWA <span className="text-accent">Shyam Kunj</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors hover:text-accent ${
                  location.pathname === link.to
                    ? "text-accent"
                    : solid
                    ? "text-muted-foreground"
                    : "text-primary-foreground/80"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className={`hidden lg:flex items-center gap-4 text-sm ${solid ? "text-muted-foreground" : "text-primary-foreground/80"}`}>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> RWA Shyam Kunj
            </span>
            <Link to="/payments" className={`font-medium ml-2 ${solid ? "text-foreground" : "text-primary-foreground"}`}>
              Pay Dues
            </Link>
            <Link
              to="/admin/login"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                solid ? "border-muted-foreground/30 hover:bg-secondary text-foreground" : "border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground"
              } transition-colors ml-2`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Admin Panel
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={`block text-base font-medium transition-colors ${
                  location.pathname === link.to ? "text-accent" : "text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border flex flex-col gap-2 mt-2">
              <Link
                to="/payments"
                onClick={() => setIsOpen(false)}
                className="block text-sm font-medium text-foreground py-1"
              >
                Pay Dues
              </Link>
              <Link
                to="/admin/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-accent transition-colors py-1"
              >
                <LayoutDashboard className="w-4 h-4" /> Admin Panel
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
