import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, RotateCw, ExternalLink, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  item: string;
  qty: number;
  total: string;
  date: string;
  status: "Processing" | "Shipped" | "Delivered" | "Returned";
  tracking?: string;
}

const ORDERS: Order[] = [
  { id: "ORD-9001", item: "Eco Phone Case (Recycled Plastic)", qty: 2, total: "$24.00", date: "2025-12-19", status: "Shipped", tracking: "UPS3344" },
  { id: "ORD-9000", item: "Refurbished AirPods Pro", qty: 1, total: "$120.00", date: "2025-12-12", status: "Delivered", tracking: "FDX1122" },
  { id: "ORD-8999", item: "Bamboo Charging Stand", qty: 1, total: "$18.50", date: "2025-12-02", status: "Delivered" },
  { id: "ORD-8998", item: "Reclaimed Laptop Sleeve", qty: 1, total: "$32.00", date: "2025-11-21", status: "Returned" },
];

const statusColor = {
  Processing: "bg-accent/15 text-accent border-accent/30",
  Shipped: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Delivered: "bg-primary/15 text-primary border-primary/30",
  Returned: "bg-destructive/15 text-destructive border-destructive/30",
};

const DashboardOrders = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? ORDERS : ORDERS.filter((o) => o.status === filter);

  return (
    <DashboardLayout title="Orders">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-muted-foreground">Items purchased from the Swap & Exchange Center.</p>
        </div>
        <Button onClick={() => navigate("/swap")} className="bg-gradient-primary text-primary-foreground">
          <ShoppingBag className="w-4 h-4 mr-2" /> Browse Swap Center
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="mb-5">
        <TabsList>
          <TabsTrigger value="All">All</TabsTrigger>
          <TabsTrigger value="Processing">Processing</TabsTrigger>
          <TabsTrigger value="Shipped">Shipped</TabsTrigger>
          <TabsTrigger value="Delivered">Delivered</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filtered.map((o) => (
          <Card key={o.id} className="p-5 glass-lg border-border/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{o.item}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {o.id} • Qty {o.qty} • {new Date(o.date).toLocaleDateString()}
                  </p>
                  {o.tracking && (
                    <p className="text-xs text-muted-foreground mt-1">Tracking: <span className="font-mono text-foreground">{o.tracking}</span></p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-lg font-bold text-foreground">{o.total}</p>
                <Badge variant="outline" className={statusColor[o.status]}>{o.status}</Badge>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="border-border/50" onClick={() => toast.info(`Reordering ${o.item}`)}>
                  <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Reorder
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toast.info(`Order ${o.id} details`)}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 glass-lg border-border/30 text-center text-muted-foreground">No orders yet.</Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardOrders;
