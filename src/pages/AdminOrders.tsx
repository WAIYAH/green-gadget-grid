import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, XCircle, Loader2, MapPin, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const fadeIn = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email">;
type SwapItem = Pick<Database["public"]["Tables"]["swap_items"]["Row"], "id" | "name">;
type PickupCentre = Pick<Database["public"]["Tables"]["pickup_centres"]["Row"], "id" | "name">;

const statusConfig: Record<Order["status"], { color: string; icon: typeof CheckCircle }> = {
  delivered: { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  shipped: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Truck },
  processing: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  ready_for_pickup: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: MapPin },
  picked_up: { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: PackageCheck },
  cancelled: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
};

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [swapItems, setSwapItems] = useState<Record<string, SwapItem>>({});
  const [centres, setCentres] = useState<Record<string, PickupCentre>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = data || [];
    setOrders(rows);

    const userIds = Array.from(new Set(rows.map((o) => o.user_id)));
    const itemIds = Array.from(new Set(rows.map((o) => o.item_id).filter((id): id is string => !!id)));
    const centreIds = Array.from(new Set(rows.map((o) => o.pickup_centre_id).filter((id): id is string => !!id)));
    const [{ data: profileRows }, { data: itemRows }, { data: centreRows }] = await Promise.all([
      userIds.length ? supabase.from("profiles").select("id, full_name, email").in("id", userIds) : Promise.resolve({ data: [] }),
      itemIds.length ? supabase.from("swap_items").select("id, name").in("id", itemIds) : Promise.resolve({ data: [] }),
      centreIds.length ? supabase.from("pickup_centres").select("id, name").in("id", centreIds) : Promise.resolve({ data: [] }),
    ]);
    const pMap: Record<string, Profile> = {};
    (profileRows || []).forEach((p) => { pMap[p.id] = p; });
    setProfiles(pMap);
    const iMap: Record<string, SwapItem> = {};
    (itemRows || []).forEach((it) => { iMap[it.id] = it; });
    setSwapItems(iMap);
    const cMap: Record<string, PickupCentre> = {};
    (centreRows || []).forEach((c) => { cMap[c.id] = c; });
    setCentres(cMap);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const total = orders.length;
    const ready = orders.filter((o) => o.status === "ready_for_pickup").length;
    const pickedUp = orders.filter((o) => o.status === "picked_up" || o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    return [
      { label: "Total Orders", value: String(total) },
      { label: "Ready for Pickup", value: String(ready) },
      { label: "Picked Up", value: String(pickedUp) },
      { label: "Cancelled", value: String(cancelled) },
    ];
  }, [orders]);

  const updateStatus = async (id: string, status: Order["status"]) => {
    setBusyId(id);
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Order marked ${status}`);
    load();
  };

  return (
    <AdminLayout title="Orders" breadcrumbs={[{ label: "Commerce" }, { label: "Orders" }]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-sm text-muted-foreground">Track and manage customer orders</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} {...fadeIn(i)}>
            <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-x-auto">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Recent Orders</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No orders yet.</div>
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left p-3 font-medium">Item</th>
              <th className="text-left p-3 font-medium">Customer</th>
              <th className="text-center p-3 font-medium">Qty</th>
              <th className="text-left p-3 font-medium">Pickup Centre</th>
              <th className="text-left p-3 font-medium">Code</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Date</th>
              <th className="text-right p-3 font-medium">Points</th>
              <th className="text-right p-3 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => {
              const sc = statusConfig[o.status];
              const StatusIcon = sc.icon;
              const customer = profiles[o.user_id];
              const item = o.item_id ? swapItems[o.item_id] : null;
              const centre = o.pickup_centre_id ? centres[o.pickup_centre_id] : null;
              return (
                <motion.tr key={o.id} {...fadeIn(i)} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-3 text-foreground">{item?.name || "—"}</td>
                  <td className="p-3 text-foreground">{customer?.full_name || customer?.email || "—"}</td>
                  <td className="p-3 text-center text-muted-foreground">{o.quantity}</td>
                  <td className="p-3 text-muted-foreground">{centre?.name || "—"}</td>
                  <td className="p-3 font-mono text-xs text-muted-foreground">{o.pickup_code || "-"}</td>
                  <td className="p-3"><Badge className={`text-xs gap-1 capitalize ${sc.color}`}><StatusIcon className="h-3 w-3" />{o.status.replace(/_/g, " ")}</Badge></td>
                  <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right font-medium text-foreground">{o.total_points} pts</td>
                  <td className="p-3 text-right">
                    <Select
                      value={o.status}
                      disabled={busyId === o.id}
                      onValueChange={(v: Order["status"]) => updateStatus(o.id, v)}
                    >
                      <SelectTrigger className="w-[150px] h-8 text-xs ml-auto"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                        <SelectItem value="picked_up">Picked Up</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        )}
      </Card>
    </AdminLayout>
  );
};

export default AdminOrders;
