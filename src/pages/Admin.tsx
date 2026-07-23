import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Users, Smartphone, Coins, DollarSign, FileText, ShoppingBag, Package,
  Wallet, TicketCheck, Megaphone, BarChart3, ArrowRight, Clock, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const fadeIn = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06 } });

const QUICK_LINKS = [
  { label: "Users", desc: "Manage accounts & roles", icon: Users, path: "/admin/users" },
  { label: "Gadgets", desc: "Review submissions", icon: Smartphone, path: "/admin/gadgets" },
  { label: "Swap Catalog", desc: "Manage listings", icon: ShoppingBag, path: "/admin/swaps" },
  { label: "Articles", desc: "Learning Center content", icon: FileText, path: "/admin/articles" },
  { label: "Orders", desc: "Pickup fulfillment", icon: Package, path: "/admin/orders" },
  { label: "Payouts", desc: "Cash payout requests", icon: Wallet, path: "/admin/payouts" },
  { label: "Tickets", desc: "Support requests", icon: TicketCheck, path: "/admin/tickets" },
  { label: "Announcements", desc: "Broadcast updates", icon: Megaphone, path: "/admin/announcements" },
  { label: "Analytics", desc: "Platform activity", icon: BarChart3, path: "/admin/analytics" },
];

interface RecentGadget { id: string; name: string; brand: string | null; created_at: string; submitter: string }

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [gadgetsProcessed, setGadgetsProcessed] = useState(0);
  const [pointsIssued, setPointsIssued] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [recentGadgets, setRecentGadgets] = useState<RecentGadget[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [
      { count: users },
      { count: processed },
      { data: earnings },
      { data: orders },
      { count: pending },
      { count: tickets },
      { data: pendingRows },
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("gadgets").select("id", { count: "exact", head: true }).in("status", ["approved", "sold"]),
      supabase.from("transactions").select("points").eq("type", "earning"),
      supabase.from("orders").select("total_amount").eq("payment_method", "cash"),
      supabase.from("gadgets").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("gadgets").select("id, name, brand, created_at, user_id").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
    ]);
    setUserCount(users || 0);
    setGadgetsProcessed(processed || 0);
    setPointsIssued((earnings || []).reduce((s, t) => s + t.points, 0));
    setRevenue((orders || []).reduce((s, o) => s + Number(o.total_amount), 0));
    setPendingCount(pending || 0);
    setOpenTickets(tickets || 0);

    const rows = pendingRows || [];
    const userIds = Array.from(new Set(rows.map((g) => g.user_id)));
    let profileMap: Record<string, string> = {};
    if (userIds.length) {
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name || p.email || "—"]));
    }
    setRecentGadgets(rows.map((g) => ({ id: g.id, name: g.name, brand: g.brand, created_at: g.created_at, submitter: profileMap[g.user_id] || "—" })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => [
    { label: "Total Users", value: userCount.toLocaleString(), icon: Users },
    { label: "Gadgets Processed", value: gadgetsProcessed.toLocaleString(), icon: Smartphone },
    { label: "Points Issued", value: pointsIssued.toLocaleString(), icon: Coins },
    { label: "Cash Revenue", value: `$${revenue.toFixed(2)}`, icon: DollarSign },
  ], [userCount, gadgetsProcessed, pointsIssued, revenue]);

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="p-16 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading dashboard…
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Live overview of platform activity</p>
      </div>

      {/* Real stats, computed live from the database */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} {...fadeIn(i)}>
              <Card className="p-5 glass-hover">
                <div className="p-2 rounded-lg bg-primary/10 w-fit mb-3">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Needs attention */}
        <Card className="lg:col-span-2 p-5 glass">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Needs Attention</h2>
            <div className="flex gap-2">
              {pendingCount > 0 && <Badge className="bg-accent/15 text-accent border-0">{pendingCount} pending gadgets</Badge>}
              {openTickets > 0 && <Badge className="bg-destructive/15 text-destructive border-0">{openTickets} open tickets</Badge>}
            </div>
          </div>
          <div className="space-y-2">
            {recentGadgets.map((g) => (
              <button
                key={g.id}
                onClick={() => navigate("/admin/gadgets")}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{g.name}{g.brand ? ` — ${g.brand}` : ""}</p>
                  <p className="text-[11px] text-muted-foreground">{g.submitter}</p>
                </div>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1 shrink-0">
                  <Clock className="w-3 h-3" /> {new Date(g.created_at).toLocaleDateString()}
                </span>
              </button>
            ))}
            {recentGadgets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No pending gadgets — all caught up.</p>
            )}
          </div>
          {recentGadgets.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/gadgets")} className="w-full mt-2 text-primary">
              Review all pending <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          )}
        </Card>

        <Card className="p-5 glass">
          <h2 className="text-lg font-bold text-foreground mb-4">Quick Links</h2>
          <div className="space-y-1.5">
            {QUICK_LINKS.slice(0, 5).map((l) => {
              const Icon = l.icon;
              return (
                <button
                  key={l.path}
                  onClick={() => navigate(l.path)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground flex-1">{l.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-5 glass">
        <h2 className="text-lg font-bold text-foreground mb-4">All Admin Sections</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {QUICK_LINKS.map((l, i) => {
            const Icon = l.icon;
            return (
              <motion.button
                key={l.path}
                {...fadeIn(i)}
                onClick={() => navigate(l.path)}
                className="p-4 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
              >
                <Icon className="w-5 h-5 text-primary mb-2" />
                <p className="text-sm font-semibold text-foreground">{l.label}</p>
                <p className="text-xs text-muted-foreground">{l.desc}</p>
              </motion.button>
            );
          })}
        </div>
      </Card>
    </AdminLayout>
  );
};

export default Admin;
