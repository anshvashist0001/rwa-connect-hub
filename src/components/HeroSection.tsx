import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-residential.jpg";

const HeroSection = () => (
  <section className="relative h-screen min-h-[600px] flex items-end">
    {/* Background */}
    <div className="absolute inset-0">
      <img
        src={heroImage}
        alt="RWA Shyam Kunj Residential Complex"
        className="w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 bg-hero-overlay/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-hero-overlay/80 via-transparent to-hero-overlay/20" />
    </div>

    {/* Content */}
    <div className="relative container mx-auto px-4 md:px-8 pb-16 md:pb-24">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div className="max-w-2xl">
          <h1
            className="text-4xl sm:text-5xl md:text-7xl font-serif italic font-medium leading-[1.1] text-primary-foreground animate-fade-in-up"
          >
            A new level of{" "}
            <br />
            community{" "}
            <span className="not-italic font-bold">living</span>
          </h1>
        </div>

        <div className="max-w-sm animate-slide-in-right" style={{ animationDelay: "0.3s", opacity: 0 }}>
          <p className="text-primary-foreground/80 text-sm mb-6 leading-relaxed">
            Welcome to RWA Shyam Kunj — where neighbors become family. Stay updated, stay connected.
          </p>
          <Link to="/notices">
            <Button variant="hero" size="lg" className="gap-3 px-8">
              View Notices
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default HeroSection;
