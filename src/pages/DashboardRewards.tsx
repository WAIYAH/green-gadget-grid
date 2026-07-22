import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Gift, Coins, Sparkles, Crown, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Reward = Database["public"]["Tables"]["rewards"]["Row"];

const TIERS = [
  { name: "Bronze", min: 0, color: "text-amber-700" },
  { name: "Silver", min: 1000, color: "text-slate-300" },
  { name: "Gold", min: 5000, color: "text-yellow-400" },
  { name: "Platinum", min: 10000, color: "text-cyan-300" },
];

const iconForCategory = (category: string | null) => {
  const c = (category || "").toLowerCase();
  if (c.includes("gift")) return Gift;
  if (c.includes("donation") || c.includes("impact")) return Sparkles;
  if (c.includes("perk") || c.includes("membership")) return Crown;
  return Award;
};

const DashboardRewards = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: rewardRows, error }, profileRes] = await Promise.all([
      supabase.from("rewards").select("*").eq("active", true).order("points_cost", { ascending: true }),
      user ? supabase.from("profiles").select("points").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    if (error) { toast.error(error.message); setLoading(false); return; }
    setRewards(rewardRows || []);
    setPoints(profileRes.data?.points ?? 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const currentTier = TIERS.slice().reverse().find((t) => points >= t.min) ?? TIERS[0];
  const nextTier = TIERS.find((t) => t.min > points);
  const progress = nextTier ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;

  const redeem = async (reward: Reward) => {
    setRedeemingId(reward.id);
    const { error } = await supabase.rpc("redeem_reward", { _reward_id: reward.id });
    setRedeemingId(null);
    if (error) return toast.error(error.message);
    toast.success(`${reward.name} redeemed!`);
    load();
    window.dispatchEvent(new Event("points:refresh"));
  };

  return (
    <DashboardLayout title="Rewards">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Rewards Center</h1>
        <p className="text-sm text-muted-foreground">Redeem your hard-earned points for real-world rewards.</p>
      </div>

      <Card className="p-6 glass-lg border-border/30 mb-6 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="grid md:grid-cols-3 gap-6 items-center">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Balance</p>
            <p className="text-4xl font-bold text-foreground flex items-center gap-2 mt-1">
              <Coins className="w-8 h-8 text-accent" /> {points.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">≈ ${(points * 0.01).toFixed(2)} value</p>
          </div>
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className={`w-5 h-5 ${currentTier.color}`} />
                <span className="font-semibold">{currentTier.name} Tier</span>
              </div>
              {nextTier && <span className="text-xs text-muted-foreground">Next: <span className="text-foreground font-medium">{nextTier.name}</span></span>}
            </div>
            <Progress value={progress} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">
              {nextTier
                ? `${(nextTier.min - points).toLocaleString()} more points to ${nextTier.name}`
                : "You've reached the highest tier!"}
            </p>
            <div className="flex gap-2 mt-4">
              {TIERS.map((t) => (
                <div key={t.name} className={`flex-1 text-center py-2 rounded-lg border ${points >= t.min ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-border/30"}`}>
                  <p className={`text-xs font-medium ${points >= t.min ? "text-primary" : "text-muted-foreground"}`}>{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.min.toLocaleString()}+</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <h2 className="text-lg font-bold mb-3">Available Rewards</h2>
      {loading ? (
        <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading rewards…
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map((r) => {
          const Icon = iconForCategory(r.category);
          const affordable = points >= r.points_cost && r.stock > 0;
          return (
            <Card key={r.id} className="p-5 glass-lg border-border/30 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground">
                  <Icon className="w-6 h-6" />
                </div>
                {r.category && <Badge variant="outline" className="text-[10px] border-border/40">{r.category}</Badge>}
              </div>
              <h3 className="font-semibold text-foreground mb-1">{r.name}</h3>
              {r.description && <p className="text-xs text-muted-foreground mb-2">{r.description}</p>}
              <p className="text-sm text-primary font-bold mb-1 flex items-center gap-1">
                <Coins className="w-4 h-4" /> {r.points_cost.toLocaleString()} pts
              </p>
              <p className="text-[11px] text-muted-foreground mb-4">{r.stock > 0 ? `${r.stock} left` : "Out of stock"}</p>
              <Button
                disabled={!affordable || redeemingId === r.id}
                onClick={() => redeem(r)}
                className="mt-auto bg-gradient-primary text-primary-foreground disabled:opacity-50"
              >
                {redeemingId === r.id ? "Redeeming…" : affordable ? "Redeem" : (<><Lock className="w-4 h-4 mr-1.5" /> {r.stock <= 0 ? "Out of stock" : "Not enough points"}</>)}
              </Button>
            </Card>
          );
        })}
        {rewards.length === 0 && (
          <Card className="p-8 glass-lg border-border/30 text-center text-muted-foreground sm:col-span-2 lg:col-span-3">No rewards available right now.</Card>
        )}
      </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardRewards;
