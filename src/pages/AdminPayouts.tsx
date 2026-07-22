import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Search, Clock, CheckCircle2, XCircle,
  DollarSign, Users, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Payout = Database["public"]["Tables"]["payouts"]["Row"];
type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email">;

const statusConfig: Record<Payout["status"], { color: string; icon: typeof CheckCircle2 }> = {
  pending: { color: "bg-accent/15 text-accent", icon: Clock },
  processing: { color: "bg-primary/15 text-primary", icon: ArrowUpRight },
  completed: { color: "bg-primary/15 text-primary", icon: CheckCircle2 },
  failed: { color: "bg-destructive/15 text-destructive", icon: XCircle },
};

const AdminPayouts = () => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMethod, setFilterMethod] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("payouts").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = data || [];
    setPayouts(rows);
    const userIds = Array.from(new Set(rows.map((p) => p.user_id)));
    if (userIds.length) {
      const { data: profileRows } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const map: Record<string, Profile> = {};
      (profileRows || []).forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = payouts.filter((p) => {
    const recipient = profiles[p.user_id];
    const q = search.toLowerCase();
    const matchSearch = (recipient?.full_name || "").toLowerCase().includes(q) || (recipient?.email || "").toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    const matchMethod = filterMethod === "all" || p.method === filterMethod;
    return matchSearch && matchMethod;
  });

  const stats = useMemo(() => {
    const pending = payouts.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
    const completed = payouts.filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount), 0);
    const recipients = new Set(payouts.map((p) => p.user_id)).size;
    const avg = payouts.length ? payouts.reduce((s, p) => s + Number(p.amount), 0) / payouts.length : 0;
    return [
      { label: "Pending", value: `$${pending.toFixed(2)}`, icon: Clock, color: "text-accent" },
      { label: "Completed", value: `$${completed.toFixed(2)}`, icon: CheckCircle2, color: "text-primary" },
      { label: "Recipients", value: String(recipients), icon: Users, color: "text-primary" },
      { label: "Avg Payout", value: `$${avg.toFixed(2)}`, icon: DollarSign, color: "text-primary" },
    ];
  }, [payouts]);

  const setStatus = async (id: string, status: Payout["status"]) => {
    setBusyId(id);
    const payload: { status: Payout["status"]; processed_at?: string } = { status };
    if (status === "completed" || status === "failed") payload.processed_at = new Date().toISOString();
    const { error } = await supabase.from("payouts").update(payload).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Payout marked ${status}`);
    load();
  };

  return (
    <AdminLayout title="Payouts">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Payouts</h1>
          <p className="text-sm text-muted-foreground">Manage user cash payout requests</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="p-5 glass-hover">
                <Icon className={`w-5 h-5 mb-2 ${s.color}`} />
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="p-4 glass mb-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by recipient or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterMethod} onValueChange={setFilterMethod}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
              <SelectItem value="paypal">PayPal</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="glass">
        <Tabs defaultValue="all" className="p-4 lg:p-6">
          <TabsList className="bg-muted/30">
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>

          {(["all", "pending", "processing", "completed", "failed"] as const).map((tab) => {
            const list = tab === "all" ? filtered : filtered.filter((p) => p.status === tab);
            return (
              <TabsContent key={tab} value={tab} className="mt-6">
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading…</div>
                ) : (
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="text-left p-3 text-xs text-muted-foreground font-medium">Recipient</th>
                        <th className="text-left p-3 text-xs text-muted-foreground font-medium">Amount</th>
                        <th className="text-left p-3 text-xs text-muted-foreground font-medium">Method</th>
                        <th className="text-left p-3 text-xs text-muted-foreground font-medium">Destination</th>
                        <th className="text-left p-3 text-xs text-muted-foreground font-medium">Status</th>
                        <th className="text-left p-3 text-xs text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {list.map((p) => {
                          const sc = statusConfig[p.status];
                          const SIcon = sc.icon;
                          const recipient = profiles[p.user_id];
                          return (
                            <motion.tr key={p.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="border-t border-border/30 hover:bg-muted/20 transition-colors">
                              <td className="p-3">
                                <div className="text-sm font-medium text-foreground">{recipient?.full_name || "—"}</div>
                                <div className="text-[11px] text-muted-foreground">{recipient?.email}</div>
                              </td>
                              <td className="p-3 text-sm font-medium text-foreground">${Number(p.amount).toFixed(2)}</td>
                              <td className="p-3 text-sm text-muted-foreground capitalize">{p.method}</td>
                              <td className="p-3 text-sm text-muted-foreground">{p.destination || "-"}</td>
                              <td className="p-3">
                                <Badge className={`${sc.color} border-0 gap-1 capitalize`}>
                                  <SIcon className="w-3 h-3" />{p.status}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {p.status === "pending" && (
                                  <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => setStatus(p.id, "processing")}>Approve</Button>
                                )}
                                {p.status === "processing" && (
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => setStatus(p.id, "completed")}>Complete</Button>
                                    <Button size="sm" variant="outline" className="text-destructive border-destructive/30" disabled={busyId === p.id} onClick={() => setStatus(p.id, "failed")}>Fail</Button>
                                  </div>
                                )}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
                )}
                {!loading && list.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wallet className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No payouts</p>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>
    </AdminLayout>
  );
};

export default AdminPayouts;
