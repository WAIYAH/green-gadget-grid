import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type SwapItem = Pick<Database["public"]["Tables"]["swap_items"]["Row"], "id" | "name">;

const statusColor: Record<Order["status"], string> = {
  processing: "bg-accent/15 text-accent border-accent/30",
  shipped: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  delivered: "bg-primary/15 text-primary border-primary/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const DashboardOrders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [items, setItems] = useState<Record<string, SwapItem>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = data || [];
    setOrders(rows);
    const itemIds = Array.from(new Set(rows.map((o) => o.item_id).filter((id): id is string => !!id)));
    if (itemIds.length) {
      const { data: itemRows } = await supabase.from("swap_items").select("id, name").in("id", itemIds);
      setItems(Object.fromEntries((itemRows || []).map((i) => [i.id, i])));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "All" ? orders : orders.filter((o) => o.status.toLowerCase() === filter.toLowerCase());

  return (
    <DashboardLayout title="Orders">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Orders</h1>
          <p className="text-sm text-muted-foreground">Items redeemed from the Swap & Exchange Center.</p>
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
          <TabsTrigger value="Cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
        </div>
      ) : (
      <div className="space-y-3">
        {filtered.map((o) => (
          <Card key={o.id} className="p-5 glass-lg border-border/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Package className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{o.item_id ? items[o.item_id]?.name || "Item" : "Item"}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    Qty {o.quantity} • {new Date(o.created_at).toLocaleDateString()}
                  </p>
                  {o.tracking && (
                    <p className="text-xs text-muted-foreground mt-1">Tracking: <span className="font-mono text-foreground">{o.tracking}</span></p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-lg font-bold text-foreground">
                  {o.payment_method === "points" ? `${o.total_points.toLocaleString()} pts` : `$${Number(o.total_amount).toFixed(2)}`}
                </p>
                <Badge variant="outline" className={`capitalize ${statusColor[o.status]}`}>{o.status}</Badge>
              </div>
            </div>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="p-8 glass-lg border-border/30 text-center text-muted-foreground">No orders yet.</Card>
        )}
      </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardOrders;
