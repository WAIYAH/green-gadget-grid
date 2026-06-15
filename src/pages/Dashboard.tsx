import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Smartphone, Award, Leaf, TrendingUp, Plus, ArrowRight, ArrowLeftRight,
  Package, Coins, CheckCircle2, Clock,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const chartData = [
  { month: "Jul", points: 320 },
  { month: "Aug", points: 740 },
  { month: "Sep", points: 1180 },
  { month: "Oct", points: 1620 },
  { month: "Nov", points: 2050 },
  { month: "Dec", points: 2450 },
];

const recentActivity = [
  { icon: CheckCircle2, color: "text-primary", text: "iPhone 12 approved", points: "+850 pts", time: "2h ago" },
  { icon: ArrowLeftRight, color: "text-accent", text: "Swap Sony WH-1000XM4", points: "-1,800 pts", time: "Yesterday" },
  { icon: Package, color: "text-primary", text: "Pickup completed", points: "+420 pts", time: "3d ago" },
  { icon: Award, color: "text-accent", text: "Silver tier reached", points: "Achievement", time: "5d ago" },
];

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Home" breadcrumbs={[{ label: "Dashboard" }]}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Welcome back 👋</h1>
        <p className="text-muted-foreground text-sm">Here's what's happening with your gadgets and rewards.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Points", value: "2,450", icon: Coins, accent: "text-accent", trend: "+18%" },
          { label: "Listings", value: "12", icon: Smartphone, accent: "text-primary", trend: "+2 new" },
          { label: "CO₂ Saved", value: "87.5 kg", icon: Leaf, accent: "text-primary", trend: "+12 kg" },
          { label: "Swaps", value: "5", icon: ArrowLeftRight, accent: "text-accent", trend: "1 active" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 glass-lg border-border/30">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center ${s.accent}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  <TrendingUp className="w-3 h-3 mr-1" />{s.trend}
                </Badge>
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
            <Badge className="bg-primary/10 text-primary border-primary/20">+665%</Badge>
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
              <p className="text-lg font-bold text-foreground">Silver</p>
            </div>
          </div>
          <div className="mb-2 flex justify-between text-xs">
            <span className="text-muted-foreground">Progress to Gold</span>
            <span className="text-foreground font-medium">2,450 / 5,000</span>
          </div>
          <Progress value={49} className="h-2 mb-4" />
          <p className="text-xs text-muted-foreground mb-4">
            Earn <span className="text-primary font-medium">2,550 more points</span> to unlock Gold tier perks.
          </p>
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
            {recentActivity.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className={`w-9 h-9 rounded-lg bg-muted/40 flex items-center justify-center ${a.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.text}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{a.time}</p>
                  </div>
                  <span className={`text-sm font-semibold ${a.points.startsWith("-") ? "text-destructive" : "text-primary"}`}>{a.points}</span>
                </div>
              );
            })}
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
