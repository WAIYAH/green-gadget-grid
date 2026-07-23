import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Smartphone, Award, Leaf, TrendingUp, Plus, ArrowRight, ArrowLeftRight,
  Package, Coins, CheckCircle2, XCircle, Clock, Loader2, BookOpen,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

const TIERS = [
  { name: "Bronze", min: 0 },
  { name: "Silver", min: 1000 },
  { name: "Gold", min: 5000 },
  { name: "Platinum", min: 10000 },
];

const typeIcon: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  earning: { icon: CheckCircle2, color: "text-primary" },
  redemption: { icon: ArrowLeftRight, color: "text-accent" },
  purchase: { icon: Package, color: "text-primary" },
  payout: { icon: XCircle, color: "text-destructive" },
};

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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listingCount, setListingCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: profileRow }, { count: gadgetCount }, { count: ordersCount }, { data: txRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("gadgets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProfile(profileRow);
    setListingCount(gadgetCount || 0);
    setOrderCount(ordersCount || 0);
    setTransactions(txRows || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const chartData = useMemo(() => {
    const months: { key: string; month: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en-US", { month: "short" }) });
    }
    const pointsBeforeWindow = transactions
      .filter((t) => new Date(t.created_at) < new Date(now.getFullYear(), now.getMonth() - 5, 1))
      .reduce((s, t) => s + t.points, 0);

    let running = pointsBeforeWindow;
    return months.map(({ key, month }) => {
      const [y, m] = key.split("-").map(Number);
      const monthDelta = transactions
        .filter((t) => { const d = new Date(t.created_at); return d.getFullYear() === y && d.getMonth() === m; })
        .reduce((s, t) => s + t.points, 0);
      running += monthDelta;
      return { month, points: Math.max(running, 0) };
    });
  }, [transactions]);

  const points = profile?.points ?? 0;
  const currentTier = TIERS.slice().reverse().find((t) => points >= t.min) ?? TIERS[0];
  const nextTier = TIERS.find((t) => t.min > points);
  const tierProgress = nextTier ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;

  const recentActivity = transactions.slice(0, 4);

  if (loading) {
    return (
      <DashboardLayout title="Home" breadcrumbs={[{ label: "Dashboard" }]}>
        <div className="p-16 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading dashboard…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Home" breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="text-muted-foreground text-sm">Here's what's happening with your gadgets and rewards.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Points", value: points.toLocaleString(), icon: Coins, accent: "text-accent" },
          { label: "Listings", value: String(listingCount), icon: Smartphone, accent: "text-primary" },
          { label: "CO₂ Saved", value: `${Number(profile?.co2_saved ?? 0).toFixed(1)} kg`, icon: Leaf, accent: "text-primary" },
          { label: "Orders", value: String(orderCount), icon: ArrowLeftRight, accent: "text-accent" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 glass-lg border-border/30">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center ${s.accent}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Chart */}
        <Card className="lg:col-span-2 p-5 glass-lg border-border/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Points Trend</h2>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="pts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="points" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#pts)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Tier progress */}
        <Card className="p-5 glass-lg border-border/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Award className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current Tier</p>
              <p className="text-lg font-bold text-foreground">{profile?.tier || currentTier.name}</p>
            </div>
          </div>
          {nextTier ? (
            <>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-muted-foreground">Progress to {nextTier.name}</span>
                <span className="text-foreground font-medium">{points.toLocaleString()} / {nextTier.min.toLocaleString()}</span>
              </div>
              <Progress value={tierProgress} className="h-2 mb-4" />
              <p className="text-xs text-muted-foreground mb-4">
                Earn <span className="text-primary font-medium">{(nextTier.min - points).toLocaleString()} more points</span> to unlock {nextTier.name} tier perks.
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground mb-4">You've reached the highest tier!</p>
          )}
          <Button onClick={() => navigate("/dashboard/rewards")} variant="outline" className="w-full border-primary/30 text-primary hover:bg-primary/10">
            View Rewards <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>
      </div>

      {/* Recent activity + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5 glass-lg border-border/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Recent Activity</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/transactions")} className="text-xs text-primary">
              View all <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          <div className="space-y-2">
            {recentActivity.map((a) => {
              const cfg = typeIcon[a.type] || { icon: Clock, color: "text-muted-foreground" };
              const Icon = cfg.icon;
              return (
                <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={`w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.description || a.type}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(a.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold ${a.points < 0 ? "text-destructive" : "text-primary"}`}>
                    {a.points !== 0 ? `${a.points > 0 ? "+" : ""}${a.points.toLocaleString()} pts` : `$${Number(a.amount).toFixed(2)}`}
                  </span>
                </div>
              );
            })}
            {recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No activity yet — submit your first gadget!</p>
            )}
          </div>
        </Card>

        <Card className="p-5 glass-lg border-border/30">
          <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Button onClick={() => navigate("/submit-gadget")} className="w-full justify-start bg-gradient-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Submit a Gadget
            </Button>
            <Button onClick={() => navigate("/swap")} variant="outline" className="w-full justify-start border-border/50">
              <ArrowLeftRight className="w-4 h-4 mr-2" /> Browse Swap Center
            </Button>
            <Button onClick={() => navigate("/dashboard/rewards")} variant="outline" className="w-full justify-start border-border/50">
              <Award className="w-4 h-4 mr-2" /> Redeem Rewards
            </Button>
            <Button onClick={() => navigate("/dashboard/learning")} variant="outline" className="w-full justify-start border-border/50">
              <BookOpen className="w-4 h-4 mr-2" /> Learning Center
            </Button>
            <Button onClick={() => navigate("/dashboard/impact")} variant="outline" className="w-full justify-start border-border/50">
              <Leaf className="w-4 h-4 mr-2" /> View Impact
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
