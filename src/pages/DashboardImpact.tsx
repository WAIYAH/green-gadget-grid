import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Droplet, Zap, Recycle, Award, Trophy, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const monthly = [
  { month: "Jul", co2: 5 }, { month: "Aug", co2: 8 }, { month: "Sep", co2: 12 },
  { month: "Oct", co2: 18 }, { month: "Nov", co2: 22 }, { month: "Dec", co2: 28 },
];

const BADGES = [
  { name: "First Submission", icon: Sparkles, earned: true },
  { name: "Eco Warrior", icon: Leaf, earned: true },
  { name: "5 Gadgets Recycled", icon: Recycle, earned: true },
  { name: "Silver Tier", icon: Award, earned: true },
  { name: "Gold Tier", icon: Trophy, earned: false },
  { name: "100 kg CO₂ Saved", icon: Leaf, earned: false },
];

const DashboardImpact = () => (
  <DashboardLayout title="Impact Tracker">
    <div className="mb-6">
      <h1 className="text-2xl font-bold">Your Environmental Impact</h1>
      <p className="text-sm text-muted-foreground">See the real-world difference your recycling makes.</p>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[
        { label: "CO₂ Saved", value: "87.5 kg", icon: Leaf, eq: "= 350 km not driven" },
        { label: "E-Waste Diverted", value: "12.4 kg", icon: Recycle, eq: "from landfill" },
        { label: "Water Saved", value: "1,240 L", icon: Droplet, eq: "in manufacturing" },
        { label: "Energy Saved", value: "320 kWh", icon: Zap, eq: "= 1 month home use" },
      ].map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.label} className="p-5 glass-lg border-border/30">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground mb-3">
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-1">{s.eq}</p>
          </Card>
        );
      })}
    </div>

    <Card className="p-5 glass-lg border-border/30 mb-6">
      <h2 className="text-lg font-bold mb-4">Monthly CO₂ Saved (kg)</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={monthly}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
          <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
          <Bar dataKey="co2" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>

    <Card className="p-5 glass-lg border-border/30">
      <h2 className="text-lg font-bold mb-4">Achievements</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {BADGES.map((b) => {
          const Icon = b.icon;
          return (
            <div key={b.name} className={`p-4 rounded-xl text-center border ${b.earned ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-border/30 opacity-50"}`}>
              <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${b.earned ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-foreground">{b.name}</p>
              {b.earned && <Badge variant="outline" className="mt-2 text-[10px] border-primary/30 text-primary">Earned</Badge>}
            </div>
          );
        })}
      </div>
    </Card>
  </DashboardLayout>
);

export default DashboardImpact;
