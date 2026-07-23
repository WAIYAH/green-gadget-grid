import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Menu, Search, Coins, ChevronDown, User, Settings, LogOut, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

interface Props {
  breadcrumbs: { label: string; path?: string }[];
  onMenuToggle: () => void;
}

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

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

const DashboardHeader = ({ breadcrumbs, onMenuToggle }: Props) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState(0);
  const [fullName, setFullName] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchHeaderData = useCallback(async () => {
    if (!user) return;
    const [{ data: profile }, { data: notifRows }, { count: unreadCount }] = await Promise.all([
      supabase.from("profiles").select("points, full_name").eq("id", user.id).maybeSingle(),
      supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("read", false),
    ]);
    setPoints(profile?.points ?? 0);
    setFullName(profile?.full_name || "");
    setNotifications(notifRows || []);
    setUnread(unreadCount || 0);
  }, [user]);

  useEffect(() => {
    fetchHeaderData();
    window.addEventListener("points:refresh", fetchHeaderData);
    return () => window.removeEventListener("points:refresh", fetchHeaderData);
  }, [fetchHeaderData]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Quick search over the user's own gadget listings — the header search
  // used to be decorative (it never queried anything); this makes it real.
  useEffect(() => {
    if (!user || searchQuery.trim().length < 2) { setSearchResults([]); return; }
    let cancelled = false;
    const t = setTimeout(() => {
      supabase
        .from("gadgets")
        .select("id, name")
        .eq("user_id", user.id)
        .ilike("name", `%${searchQuery.trim()}%`)
        .limit(5)
        .then(({ data }) => { if (!cancelled) setSearchResults(data || []); });
    }, 250);
    return () => { cancelled = true; clearTimeout(t); };
  }, [searchQuery, user]);

  const goToListings = (q: string) => {
    setShowSearch(false);
    navigate(`/dashboard/listings?q=${encodeURIComponent(q)}`);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleNotificationClick = async (n: Notification) => {
    setShowNotifs(false);
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((prev) => Math.max(0, prev - 1));
      supabase.from("notifications").update({ read: true }).eq("id", n.id).then(({ error }) => {
        if (error) console.error("Failed to mark notification read:", error.message);
      });
    }
    if (n.link) navigate(n.link);
  };

  const initial = (fullName || user?.email || "U").charAt(0).toUpperCase();

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border/30 glass-sm sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="md:hidden p-2 rounded-lg hover:bg-muted/50">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <nav className="hidden sm:flex items-center gap-1.5 text-sm">
          {breadcrumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/40">/</span>}
              {c.path ? (
                <button onClick={() => navigate(c.path!)} className="text-muted-foreground hover:text-foreground transition-colors">
                  {c.label}
                </button>
              ) : (
                <span className="text-foreground font-medium">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {/* Quick search over My Listings */}
        <div ref={searchRef} className="relative hidden md:block">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-sm text-muted-foreground text-sm w-56">
            <Search className="w-4 h-4 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
              onKeyDown={(e) => { if (e.key === "Enter" && searchQuery.trim()) goToListings(searchQuery.trim()); }}
              placeholder="Search my listings…"
              className="bg-transparent outline-none flex-1 text-sm placeholder:text-muted-foreground/60 min-w-0"
            />
          </div>
          <AnimatePresence>
            {showSearch && searchQuery.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-72 rounded-xl glass-lg border border-border/50 shadow-elevated overflow-hidden z-50"
              >
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No listings match "{searchQuery.trim()}"</p>
                ) : (
                  searchResults.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => goToListings(r.name)}
                      className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-muted/30 transition-colors border-b border-border/10 last:border-0"
                    >
                      {r.name}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Points pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-sm font-semibold">
          <Coins className="w-4 h-4 text-accent" />
          <span className="text-accent">{points.toLocaleString()}</span>
          <span className="text-muted-foreground text-xs">pts</span>
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                {unread}
              </span>
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
                    onClick={() => { navigate("/dashboard/notifications"); setShowNotifs(false); }}
                    className="text-[11px] text-primary hover:underline"
                  >
                    View all
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
                  <p className="text-sm font-semibold text-foreground">{fullName || "Triple G User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => { navigate("/dashboard/profile"); setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/30"
                  >
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button
                    onClick={() => { navigate("/dashboard/settings"); setShowProfile(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-muted/30"
                  >
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                </div>
                <div className="border-t border-border/30 p-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-destructive hover:bg-destructive/10"
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

export default DashboardHeader;
