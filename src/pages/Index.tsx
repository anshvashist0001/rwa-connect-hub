import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import NoticesPreview from "@/components/NoticesPreview";
import EventsPreview from "@/components/EventsPreview";
import QuickActions from "@/components/QuickActions";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <QuickActions />
    <NoticesPreview />
    <EventsPreview />
    <Footer />
  </div>
);

export default Index;
