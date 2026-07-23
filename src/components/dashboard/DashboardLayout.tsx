import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Smartphone, Package, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

interface Props {
  children: React.ReactNode;
  title: string;
  breadcrumbs?: { label: string; path?: string }[];
}

const MOBILE_NAV = [
  { label: "Home", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Listings", icon: Smartphone, path: "/dashboard/listings" },
  { label: "Orders", icon: Package, path: "/dashboard/orders" },
  { label: "Profile", icon: UserCircle, path: "/dashboard/profile" },
];

const DashboardLayout = ({ children, title, breadcrumbs }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const defaultCrumbs = [{ label: "Dashboard", path: "/dashboard" }, { label: title }];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
          />
          <div className="fixed left-0 top-0 bottom-0 z-40 w-[250px] md:hidden">
            <DashboardSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <motion.div
        animate={{ marginLeft: typeof window !== "undefined" && window.innerWidth >= 768 ? (collapsed ? 70 : 250) : 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen flex flex-col"
      >
        <DashboardHeader
          breadcrumbs={breadcrumbs || defaultCrumbs}
          onMenuToggle={() => setMobileOpen(!mobileOpen)}
        />
        <main className="flex-1 p-4 lg:p-6 pb-24 md:pb-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>
      </motion.div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden glass-lg border-t border-border/30">
        <div className="flex items-center justify-around py-2">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
