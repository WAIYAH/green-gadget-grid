import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, RefreshCw, ChevronDown, Menu, Clock, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database as DB } from "@/integrations/supabase/types";

interface AdminHeaderProps {
  breadcrumbs: { label: string; path?: string }[];
  onMenuToggle: () => void;
}

type Notification = DB["public"]["Tables"]["notifications"]["Row"];

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const AdminHeader = ({ breadcrumbs, onMenuToggle }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [fullName, setFullName] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchHeaderData = useCallback(async () => {
    if (!user) return;
    const [{ data: profile }, { data: notifRows }, { count }] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
    ]);
    setFullName(profile?.full_name || "");
    setNotifications(notifRows || []);
    setUnreadCount(count || 0);
  }, [user]);

  useEffect(() => { fetchHeaderData(); }, [fetchHeaderData]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    setShowNotifs(false);
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", n.id);
      if (error) console.error("Failed to mark notification read:", error.message);
    }
    if (n.link) navigate(n.link);
  };

  const markAllRead = async () => {
    if (!user) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    if (error) console.error("Failed to mark all notifications read:", error.message);
  };

  const initial = (fullName || user?.email || "A").charAt(0).toUpperCase();

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border/30 glass-sm sticky top-0 z-30">
      {/* Left: mobile menu + breadcrumbs */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="md:hidden p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <Menu className="w-5 h-5 text-foreground" />
        </button>

        <nav className="hidden sm:flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/40">/</span>}
              {crumb.path ? (
                <button
                  onClick={() => navigate(crumb.path!)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-foreground font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Environment badge */}
        <span className={cn(
          "hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
          import.meta.env.PROD ? "bg-primary/10 text-primary border-primary/30" : "bg-accent/20 text-accent border-accent/30"
        )}>
          {import.meta.env.PROD ? "Prod" : "Dev"}
        </span>

        {/* Refresh */}
        <Button
          size="icon"
          variant="ghost"
          className="w-8 h-8 text-muted-foreground hover:text-foreground"
          title="Refresh page data"
          onClick={() => window.location.reload()}
        >
          <RefreshCw className="w-4 h-4" />
        </Button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Bell className="w-4.5 h-4.5 text-muted-foreground" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold animate-glow-pulse"
              >
                {unreadCount}
              </motion.span>
            )}
          </button>
          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-xl glass-lg border border-border/50 shadow-elevated overflow-hidden z-50"
              >
                <div className="p-3 border-b border-border/30 flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Notifications</span>
                  <button
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                    className="text-[11px] text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 border-b border-border/10 hover:bg-muted/30 transition-colors cursor-pointer",
                          !n.read && "bg-primary/5"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />}
                          <div className={cn(!n.read ? "" : "ml-4")}>
                            <p className="text-sm font-medium text-foreground">{n.title}</p>
                            {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                            <p className="text-[11px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {timeAgo(n.created_at)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                {initial}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card bg-primary" />
            </div>
            <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
          </button>
          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl glass-lg border border-border/50 shadow-elevated overflow-hidden z-50"
              >
                <div className="p-3 border-b border-border/30">
                  <p className="text-sm font-semibold text-foreground">{fullName || "Admin"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { navigate("/admin/profile"); setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
                  >
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button
                    onClick={() => { navigate("/admin/settings"); setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                </div>
                <div className="border-t border-border/30 p-1.5">
                  <button
                    onClick={async () => {
                      await signOut();
                      navigate("/login");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
