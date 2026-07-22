import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Smartphone, Coins, Leaf, Loader2, CheckCircle2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const fadeIn = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

type Gadget = Pick<Database["public"]["Tables"]["gadgets"]["Row"], "status" | "category" | "created_at">;
type Transaction = Pick<Database["public"]["Tables"]["transactions"]["Row"], "type" | "points" | "created_at">;

const CATEGORY_COLORS = ["bg-primary", "bg-accent", "bg-chart-3", "bg-chart-4", "bg-chart-5"];

const AdminAnalytics = () => {
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profileTotals, setProfileTotals] = useState({ co2: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: gadgetRows }, { data: txRows }, { data: profileRows }] = await Promise.all([
      supabase.from("gadgets").select("status, category, created_at"),
      supabase.from("transactions").select("type, points, created_at"),
      supabase.from("profiles").select("co2_saved"),
    ]);
    setGadgets(gadgetRows || []);
    setTransactions(txRows || []);
    setProfileTotals({
      co2: (profileRows || []).reduce((s, p) => s + Number(p.co2_saved || 0), 0),
      users: (profileRows || []).length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpis = useMemo(() => {
    const total = gadgets.length;
    const approved = gadgets.filter((g) => g.status === "approved" || g.status === "sold").length;
    const approvalRate = total ? ((approved / total) * 100).toFixed(1) : "0.0";
    const pointsIssued = transactions.filter((t) => t.type === "earning").reduce((s, t) => s + t.points, 0);
    return [
      { label: "Total Submissions", value: total.toLocaleString(), icon: Smartphone },
      { label: "Approval Rate", value: `${approvalRate}%`, icon: CheckCircle2 },
      { label: "Points Issued", value: pointsIssued.toLocaleString(), icon: Coins },
      { label: "CO₂ Saved (kg)", value: profileTotals.co2.toFixed(1), icon: Leaf },
    ];
  }, [gadgets, transactions, profileTotals]);

  const submissionTrend = useMemo(() => {
    const months: { key: string; month: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en-US", { month: "short" }) });
    }
    return months.map(({ key, month }) => {
      const [y, m] = key.split("-").map(Number);
      const count = gadgets.filter((g) => {
        const d = new Date(g.created_at);
        return d.getFullYear() === y && d.getMonth() === m;
      }).length;
      return { month, submissions: count };
    });
  }, [gadgets]);

  const categoryBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    gadgets.forEach((g) => { counts[g.category] = (counts[g.category] || 0) + 1; });
    const total = gadgets.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, count], i) => ({
        category,
        count,
        pct: Math.round((count / total) * 100),
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }));
  }, [gadgets]);

  const statusBreakdown = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, approved: 0, rejected: 0, sold: 0 };
    gadgets.forEach((g) => { counts[g.status] = (counts[g.status] || 0) + 1; });
    return counts;
  }, [gadgets]);

  if (loading) {
    return (
      <AdminLayout title="Analytics" breadcrumbs={[{ label: "Core" }, { label: "Analytics" }]}>
        <div className="p-16 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading analytics…
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics" breadcrumbs={[{ label: "Core" }, { label: "Analytics" }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Real platform activity — gadgets, points, and impact, computed live from the database.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <motion.div key={k.label} {...fadeIn(i)}>
              <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{k.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 p-5 border-border/50 bg-card/80 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Submissions Over Time
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Last 6 months</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={submissionTrend}>
              <defs>
                <linearGradient id="subs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="submissions" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#subs)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5 border-border/50 bg-card/80 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Status Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="capitalize text-muted-foreground">{status}</span>
                <span className="font-semibold text-foreground">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-6 border-border/50 bg-card/80 backdrop-blur-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4">Top Categories Submitted</h3>
        {categoryBreakdown.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <div className="space-y-4">
            {categoryBreakdown.map((c, i) => (
              <motion.div key={c.category} {...fadeIn(i)} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground capitalize">{c.category}</span>
                  <span className="text-muted-foreground">{c.count} ({c.pct}%)</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${c.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </AdminLayout>
  );
};

export default AdminAnalytics;
