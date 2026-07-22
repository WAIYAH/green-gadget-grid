import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Package, Truck, Clock, ArrowLeftRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Swap = Database["public"]["Tables"]["swaps"]["Row"];
type SwapItem = Pick<Database["public"]["Tables"]["swap_items"]["Row"], "id" | "name" | "points_price">;

const STEPS = ["pending", "confirmed", "shipped", "delivered"] as const;

const stepIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock, confirmed: CheckCircle2, shipped: Truck, delivered: Package,
};

const DashboardSwaps = () => {
  const { user } = useAuth();
  const [swaps, setSwaps] = useState<Swap[]>([]);
  const [items, setItems] = useState<Record<string, SwapItem>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Active");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("swaps").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = data || [];
    setSwaps(rows);
    const itemIds = Array.from(new Set(rows.map((s) => s.item_id).filter((id): id is string => !!id)));
    if (itemIds.length) {
      const { data: itemRows } = await supabase.from("swap_items").select("id, name, points_price").in("id", itemIds);
      setItems(Object.fromEntries((itemRows || []).map((i) => [i.id, i])));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = swaps.filter((s) => {
    if (filter === "Active") return s.status !== "delivered" && s.status !== "cancelled";
    if (filter === "Completed") return s.status === "delivered";
    if (filter === "Cancelled") return s.status === "cancelled";
    return true;
  });

  const stats = useMemo(() => [
    { label: "Total Swaps", value: swaps.length, icon: ArrowLeftRight },
    { label: "Active", value: swaps.filter((s) => s.status !== "delivered" && s.status !== "cancelled").length, icon: Truck },
    { label: "Completed", value: swaps.filter((s) => s.status === "delivered").length, icon: CheckCircle2 },
    { label: "Points Used", value: swaps.reduce((sum, s) => sum + (s.item_id ? items[s.item_id]?.points_price || 0 : 0), 0).toLocaleString(), icon: Package },
  ], [swaps, items]);

  return (
    <DashboardLayout title="Swaps">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Track Your Swaps</h1>
        <p className="text-sm text-muted-foreground">Trade-in requests, from submission to delivery.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 glass-lg border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Icon className="w-4 h-4" /></div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-4">
        <TabsList>
          <TabsTrigger value="Active">Active</TabsTrigger>
          <TabsTrigger value="Completed">Completed</TabsTrigger>
          <TabsTrigger value="Cancelled">Cancelled</TabsTrigger>
          <TabsTrigger value="All">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading swaps…
        </div>
      ) : (
      <div className="space-y-3">
        {filtered.map((s) => {
          const currentStep = STEPS.indexOf(s.status as typeof STEPS[number]);
          const cancelled = s.status === "cancelled";
          const item = s.item_id ? items[s.item_id] : null;
          return (
            <Card key={s.id} className="p-5 glass-lg border-border/30">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Package className="w-5 h-5" /></div>
                  <div>
                    <p className="font-semibold text-foreground">{item?.name || "Swap request"}</p>
                    <p className="text-xs text-muted-foreground font-mono">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item && <span className="text-sm font-semibold text-primary">{item.points_price.toLocaleString()} pts</span>}
                  <Badge variant="outline" className={`capitalize ${cancelled ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-primary/15 text-primary border-primary/30"}`}>
                    {s.status}
                  </Badge>
                </div>
              </div>

              {!cancelled && (
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    {STEPS.map((step, i) => {
                      const Icon = stepIcon[step];
                      const done = i <= currentStep;
                      return (
                        <div key={step} className="flex flex-col items-center flex-1 z-10">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${done ? "bg-gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <p className={`text-[11px] mt-1 capitalize ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute top-[18px] left-[5%] right-[5%] h-0.5 bg-muted -z-0">
                    <div className="h-full bg-gradient-primary transition-all" style={{ width: `${(Math.max(currentStep, 0) / (STEPS.length - 1)) * 100}%` }} />
                  </div>
                </div>
              )}

              {s.notes && (
                <div className="mt-4 pt-3 border-t border-border/20">
                  <p className="text-xs text-muted-foreground">{s.notes}</p>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-8 glass-lg border-border/30 text-center text-muted-foreground">
            No swaps in this category. Trade-in requests will appear here once available.
          </Card>
        )}
      </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardSwaps;
