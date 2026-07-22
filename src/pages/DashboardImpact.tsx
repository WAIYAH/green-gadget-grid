import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Droplet, Zap, Recycle, Award, Trophy, Sparkles, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Gadget = Pick<Database["public"]["Tables"]["gadgets"]["Row"], "status" | "points_value" | "weight_kg" | "updated_at">;

const DashboardImpact = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: profileRow }, { data: gadgetRows }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("gadgets").select("status, points_value, weight_kg, updated_at").eq("user_id", user.id),
    ]);
    setProfile(profileRow);
    setGadgets(gadgetRows || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const processedGadgets = gadgets.filter((g) => g.status === "approved" || g.status === "sold");
  const co2Saved = Number(profile?.co2_saved ?? 0);
  const eWasteDiverted = processedGadgets.reduce((s, g) => s + Number(g.weight_kg || 0), 0);
  const waterSaved = co2Saved * 14.2;
  const energySaved = co2Saved * 3.6;

  const monthly = useMemo(() => {
    const months: { key: string; month: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en-US", { month: "short" }) });
    }
    return months.map(({ key, month }) => {
      const [y, m] = key.split("-").map(Number);
      const co2 = processedGadgets
        .filter((g) => { const d = new Date(g.updated_at); return d.getFullYear() === y && d.getMonth() === m; })
        .reduce((s, g) => s + g.points_value * 0.05, 0);
      return { month, co2: Math.round(co2 * 10) / 10 };
    });
  }, [processedGadgets]);

  const tier = profile?.tier || "Bronze";
  const BADGES = [
    { name: "First Submission", icon: Sparkles, earned: gadgets.length >= 1 },
    { name: "Eco Warrior", icon: Leaf, earned: (profile?.points ?? 0) > 0 },
    { name: "5 Gadgets Recycled", icon: Recycle, earned: processedGadgets.length >= 5 },
    { name: "Silver Tier", icon: Award, earned: tier === "Silver" || tier === "Gold" || tier === "Platinum" },
    { name: "Gold Tier", icon: Trophy, earned: tier === "Gold" || tier === "Platinum" },
    { name: "100 kg CO₂ Saved", icon: Leaf, earned: co2Saved >= 100 },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Impact Tracker">
        <div className="p-16 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading impact data…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Impact Tracker">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Environmental Impact</h1>
        <p className="text-sm text-muted-foreground">See the real-world difference your recycling makes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "CO₂ Saved", value: `${co2Saved.toFixed(1)} kg`, icon: Leaf, eq: `≈ ${(co2Saved * 4).toFixed(0)} km not driven` },
          { label: "E-Waste Diverted", value: `${eWasteDiverted.toFixed(1)} kg`, icon: Recycle, eq: "from landfill" },
          { label: "Water Saved", value: `${waterSaved.toFixed(0)} L`, icon: Droplet, eq: "in manufacturing" },
          { label: "Energy Saved", value: `${energySaved.toFixed(0)} kWh`, icon: Zap, eq: "in production" },
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
};

export default DashboardImpact;
