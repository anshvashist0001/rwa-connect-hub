import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Notices from "./pages/Notices.tsx";
import Events from "./pages/Events.tsx";
import Payments from "./pages/Payments.tsx";
import NotFound from "./pages/NotFound.tsx";
import AdminLogin from "./pages/admin/Login.tsx";
import AdminDashboard from "./pages/admin/Dashboard.tsx";
import PaymentManagement from "./pages/admin/PaymentManagement.tsx";
import NoticeManagement from "./pages/admin/NoticeManagement.tsx";
import EventManagement from "./pages/admin/EventManagement.tsx";
import MemberManagement from "./pages/admin/MemberManagement.tsx";
import HouseManagement from "./pages/admin/HouseManagement.tsx";
import Reports from "./pages/admin/Reports.tsx";
import Committee from "./pages/Committee.tsx";
import CommitteeManagement from "./pages/admin/CommitteeManagement.tsx";
import FeeSettings from "./pages/admin/FeeSettings.tsx";
import Gallery from "./pages/Gallery.tsx";
import GalleryManagement from "./pages/admin/GalleryManagement.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/notices" element={<Notices />} />
          <Route path="/events" element={<Events />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/committee" element={<Committee />} />
          <Route path="/gallery" element={<Gallery />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute><PaymentManagement /></ProtectedRoute>} />
          <Route path="/admin/notices" element={<ProtectedRoute><NoticeManagement /></ProtectedRoute>} />
          <Route path="/admin/events" element={<ProtectedRoute><EventManagement /></ProtectedRoute>} />
          <Route path="/admin/members" element={<ProtectedRoute><MemberManagement /></ProtectedRoute>} />
          <Route path="/admin/houses" element={<ProtectedRoute><HouseManagement /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/admin/committee" element={<ProtectedRoute><CommitteeManagement /></ProtectedRoute>} />
          <Route path="/admin/fee-settings" element={<ProtectedRoute><FeeSettings /></ProtectedRoute>} />
          <Route path="/admin/gallery" element={<ProtectedRoute><GalleryManagement /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
