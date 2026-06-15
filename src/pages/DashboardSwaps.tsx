import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Package, Truck, Clock, ArrowLeftRight, MapPin } from "lucide-react";

interface Swap {
  id: string;
  item: string;
  points: number;
  date: string;
  status: "Requested" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
  tracking?: string;
}

const SWAPS: Swap[] = [
  { id: "SW-3201", item: "Sony WH-1000XM4", points: 1800, date: "2025-12-08", status: "Delivered", tracking: "DHL12345" },
  { id: "SW-3202", item: "Refurbished iPad Air", points: 3200, date: "2025-12-18", status: "Shipped", tracking: "FDX67890" },
  { id: "SW-3203", item: "Logitech MX Master 3", points: 950, date: "2025-12-22", status: "Confirmed" },
  { id: "SW-3204", item: "Anker PowerCore 20K", points: 420, date: "2025-12-23", status: "Requested" },
  { id: "SW-3205", item: "AirPods Pro 2", points: 2200, date: "2025-11-30", status: "Cancelled" },
];

const STEPS = ["Requested", "Confirmed", "Shipped", "Delivered"] as const;

const stepIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  Requested: Clock, Confirmed: CheckCircle2, Shipped: Truck, Delivered: Package,
};

const DashboardSwaps = () => {
  const [filter, setFilter] = useState("Active");

  const filtered = SWAPS.filter((s) => {
    if (filter === "Active") return s.status !== "Delivered" && s.status !== "Cancelled";
    if (filter === "Completed") return s.status === "Delivered";
    if (filter === "Cancelled") return s.status === "Cancelled";
    return true;
  });

  return (
    <DashboardLayout title="Swaps">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Track Your Swaps</h1>
        <p className="text-sm text-muted-foreground">Follow every swap order from request to delivery.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Swaps", value: SWAPS.length, icon: ArrowLeftRight },
          { label: "Active", value: SWAPS.filter((s) => s.status !== "Delivered" && s.status !== "Cancelled").length, icon: Truck },
          { label: "Completed", value: SWAPS.filter((s) => s.status === "Delivered").length, icon: CheckCircle2 },
          { label: "Points Used", value: SWAPS.reduce((s, x) => s + x.points, 0).toLocaleString(), icon: Package },
        ].map((s) => {
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

      <div className="space-y-3">
        {filtered.map((s) => {
          const currentStep = STEPS.indexOf(s.status as typeof STEPS[number]);
          const cancelled = s.status === "Cancelled";
          return (
            <Card key={s.id} className="p-5 glass-lg border-border/30">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Package className="w-5 h-5" /></div>
                  <div>
                    <p className="font-semibold text-foreground">{s.item}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.id} • {new Date(s.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-primary">{s.points.toLocaleString()} pts</span>
                  <Badge variant="outline" className={cancelled ? "bg-destructive/10 text-destructive border-destructive/30" : "bg-primary/15 text-primary border-primary/30"}>
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
                          <p className={`text-[11px] mt-1 ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="absolute top-[18px] left-[5%] right-[5%] h-0.5 bg-muted -z-0">
                    <div className="h-full bg-gradient-primary transition-all" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }} />
                  </div>
                </div>
              )}

              {s.tracking && (
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-border/20">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Tracking: <span className="font-mono text-foreground">{s.tracking}</span>
                  </p>
                  <Button size="sm" variant="outline" className="border-primary/30 text-primary">Track Package</Button>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-8 glass-lg border-border/30 text-center text-muted-foreground">No swaps in this category.</Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardSwaps;
