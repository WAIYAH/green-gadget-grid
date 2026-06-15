import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Gift, Coins, Sparkles, Star, Crown, Lock } from "lucide-react";
import { toast } from "sonner";

const REWARDS = [
  { id: 1, name: "Amazon Gift Card $10", cost: 1000, icon: Gift, category: "Gift Cards" },
  { id: 2, name: "Amazon Gift Card $25", cost: 2500, icon: Gift, category: "Gift Cards" },
  { id: 3, name: "Tree Planted in Your Name", cost: 500, icon: Sparkles, category: "Impact" },
  { id: 4, name: "Eco Tote Bag", cost: 1500, icon: Star, category: "Merch" },
  { id: 5, name: "Premium Membership (1 mo)", cost: 3000, icon: Crown, category: "Membership" },
  { id: 6, name: "Refurbished Earbuds", cost: 4500, icon: Award, category: "Gadgets" },
];

const TIERS = [
  { name: "Bronze", min: 0, color: "text-amber-700" },
  { name: "Silver", min: 1000, color: "text-slate-300" },
  { name: "Gold", min: 5000, color: "text-yellow-400" },
  { name: "Platinum", min: 10000, color: "text-cyan-300" },
];

const DashboardRewards = () => {
  const points = 2450;
  const currentTier = TIERS.slice().reverse().find((t) => points >= t.min) ?? TIERS[0];
  const nextTier = TIERS.find((t) => t.min > points);
  const progress = nextTier ? ((points - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REWARDS.map((r) => {
          const Icon = r.icon;
          const affordable = points >= r.cost;
          return (
            <Card key={r.id} className="p-5 glass-lg border-border/30 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground">
                  <Icon className="w-6 h-6" />
                </div>
                <Badge variant="outline" className="text-[10px] border-border/40">{r.category}</Badge>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{r.name}</h3>
              <p className="text-sm text-primary font-bold mb-4 flex items-center gap-1">
                <Coins className="w-4 h-4" /> {r.cost.toLocaleString()} pts
              </p>
              <Button
                disabled={!affordable}
                onClick={() => toast.success(`${r.name} redeemed!`)}
                className="mt-auto bg-gradient-primary text-primary-foreground disabled:opacity-50"
              >
                {affordable ? (<>Redeem</>) : (<><Lock className="w-4 h-4 mr-1.5" /> Not enough points</>)}
              </Button>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default DashboardRewards;
