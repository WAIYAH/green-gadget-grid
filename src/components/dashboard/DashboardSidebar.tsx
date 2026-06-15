import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Leaf, Award, Smartphone, CreditCard, ArrowLeftRight,
  Package, UserCircle, Bell, Settings, ChevronLeft, Plus, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}
interface NavSection { title: string; items: NavItem[]; }

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Home", icon: LayoutDashboard, path: "/dashboard" },
      { label: "Impact Tracker", icon: Leaf, path: "/dashboard/impact" },
      { label: "Rewards", icon: Award, path: "/dashboard/rewards" },
    ],
  },
  {
    title: "My Activity",
    items: [
      { label: "My Listings", icon: Smartphone, path: "/dashboard/listings", badge: 2 },
      { label: "Transactions", icon: CreditCard, path: "/dashboard/transactions" },
      { label: "Swaps", icon: ArrowLeftRight, path: "/dashboard/swaps", badge: 1 },
      { label: "Orders", icon: Package, path: "/dashboard/orders" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", icon: UserCircle, path: "/dashboard/profile" },
      { label: "Notifications", icon: Bell, path: "/dashboard/notifications", badge: 3 },
      { label: "Settings", icon: Settings, path: "/dashboard/settings" },
    ],
  },
];

interface Props { collapsed: boolean; onToggle: () => void; }

const DashboardSidebar = ({ collapsed, onToggle }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string[]>(NAV_SECTIONS.map((s) => s.title));

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname === path;

  const toggleSection = (title: string) =>
    setExpanded((p) => (p.includes(title) ? p.filter((t) => t !== title) : [...p, title]));

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    navigate("/login");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 70 : 250 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col glass-lg border-r border-border/50 overflow-hidden"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-border/30">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-bold text-foreground whitespace-nowrap text-gradient-primary"
              >
                Triple G
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Submit Gadget CTA */}
      <div className="px-3 py-3 border-b border-border/20">
        <button
          onClick={() => navigate("/submit-gadget")}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-medium shadow-primary transition-all hover:opacity-90",
            collapsed && "justify-center px-2"
          )}
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">Submit Gadget</span>}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-1">
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center px-4 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                <span>{section.title}</span>
                <motion.div animate={{ rotate: expanded.includes(section.title) ? 0 : -90 }} className="ml-auto">
                  <ChevronLeft className="w-3 h-3" />
                </motion.div>
              </button>
            )}

            <AnimatePresence initial={false}>
              {(collapsed || expanded.includes(section.title)) && (
                <motion.div
                  initial={collapsed ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <motion.button
                        key={item.label}
                        onClick={() => navigate(item.path)}
                        whileHover={{ x: collapsed ? 0 : 4 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          "group w-full flex items-center gap-3 px-4 py-2 mx-2 my-0.5 rounded-lg text-sm transition-all duration-200 relative",
                          collapsed && "justify-center mx-1 px-2",
                          active
                            ? "bg-primary/15 text-primary shadow-[inset_0_0_20px_hsl(var(--primary)/0.1)]"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        {active && (
                          <motion.div
                            layoutId="userActiveIndicator"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-primary"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          />
                        )}
                        <Icon className={cn("w-[18px] h-[18px] shrink-0", active && "text-primary")} />
                        {!collapsed && (
                          <>
                            <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                            {item.badge && (
                              <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-primary/20 text-primary text-[11px] font-medium px-1.5">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                        {collapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-elevated">
                            {item.label}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div className="border-t border-border/30 p-3 space-y-1">
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
        >
          <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
            <ChevronLeft className="w-4 h-4" />
          </motion.div>
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default DashboardSidebar;
