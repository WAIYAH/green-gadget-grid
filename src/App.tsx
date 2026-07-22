import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AwarenessProvider } from "./contexts/AwarenessContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Dashboard from "./pages/Dashboard";
import DashboardListings from "./pages/DashboardListings";
import DashboardTransactions from "./pages/DashboardTransactions";
import DashboardSwaps from "./pages/DashboardSwaps";
import DashboardOrders from "./pages/DashboardOrders";
import DashboardRewards from "./pages/DashboardRewards";
import DashboardImpact from "./pages/DashboardImpact";
import DashboardLearning from "./pages/DashboardLearning";
import DashboardLearningDetail from "./pages/DashboardLearningDetail";
import DashboardProfile from "./pages/DashboardProfile";
import DashboardNotifications from "./pages/DashboardNotifications";
import DashboardSettings from "./pages/DashboardSettings";
import Admin from "./pages/Admin";
import AdminProfile from "./pages/AdminProfile";
import AdminSettings from "./pages/AdminSettings";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminReports from "./pages/AdminReports";
import AdminUsers from "./pages/AdminUsers";
import AdminGadgets from "./pages/AdminGadgets";
import AdminTransactions from "./pages/AdminTransactions";
import AdminOrders from "./pages/AdminOrders";
import AdminTickets from "./pages/AdminTickets";
import AdminFeedback from "./pages/AdminFeedback";
import AdminArticles from "./pages/AdminArticles";
import AdminSwaps from "./pages/AdminSwaps";
import AdminPayouts from "./pages/AdminPayouts";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import SubmitGadget from "./pages/SubmitGadget";
import Swap from "./pages/Swap";
import Awareness from "./pages/Awareness";
import Map from "./pages/Map";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/listings" element={<DashboardListings />} />
            <Route path="/dashboard/transactions" element={<DashboardTransactions />} />
            <Route path="/dashboard/swaps" element={<DashboardSwaps />} />
            <Route path="/dashboard/orders" element={<DashboardOrders />} />
            <Route path="/dashboard/rewards" element={<DashboardRewards />} />
            <Route path="/dashboard/impact" element={<DashboardImpact />} />
            <Route path="/dashboard/learning" element={<DashboardLearning />} />
            <Route path="/dashboard/learning/:id" element={<DashboardLearningDetail />} />
            <Route path="/dashboard/profile" element={<DashboardProfile />} />
            <Route path="/dashboard/notifications" element={<DashboardNotifications />} />
            <Route path="/dashboard/settings" element={<DashboardSettings />} />
            <Route path="/submit-gadget" element={<SubmitGadget />} />
          </Route>

          <Route element={<ProtectedRoute requireAdmin />}>
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/gadgets" element={<AdminGadgets />} />
            <Route path="/admin/transactions" element={<AdminTransactions />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/tickets" element={<AdminTickets />} />
            <Route path="/admin/feedback" element={<AdminFeedback />} />
            <Route path="/admin/articles" element={<AdminArticles />} />
            <Route path="/admin/swaps" element={<AdminSwaps />} />
            <Route path="/admin/payouts" element={<AdminPayouts />} />
            <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          </Route>
          <Route path="/swap" element={<Swap />} />
          <Route path="/awareness" element={<Awareness />} />
          <Route path="/map" element={<Map />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
