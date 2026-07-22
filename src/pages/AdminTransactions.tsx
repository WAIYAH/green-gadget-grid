import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CreditCard, DollarSign, TrendingUp, RefreshCw, Trash2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const fadeIn = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email">;

const statusColors: Record<string, string> = {
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
};

const typeColors: Record<string, string> = {
  earning: "bg-primary/10 text-primary border-primary/20",
  redemption: "bg-accent/80 text-accent-foreground border-accent",
  purchase: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  payout: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = data || [];
    setTransactions(rows);
    const userIds = Array.from(new Set(rows.map((t) => t.user_id)));
    if (userIds.length) {
      const { data: profileRows } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const map: Record<string, Profile> = {};
      (profileRows || []).forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = transactions.filter((t) => {
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchType && matchStatus;
  });

  const stats = useMemo(() => {
    const volume = transactions.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const count = transactions.length;
    const avg = count ? volume / count : 0;
    const pointsFlow = transactions.reduce((s, t) => s + t.points, 0);
    return [
      { label: "Total Volume", value: `$${volume.toFixed(2)}`, icon: DollarSign },
      { label: "Transactions", value: String(count), icon: CreditCard },
      { label: "Avg. Value", value: `$${avg.toFixed(2)}`, icon: TrendingUp },
      { label: "Net Points Flow", value: pointsFlow.toLocaleString(), icon: RefreshCw },
    ];
  }, [transactions]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("transactions").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success("Transaction deleted");
    setDeleteTarget(null);
    load();
  };

  return (
    <AdminLayout title="Transactions" breadcrumbs={[{ label: "Commerce" }, { label: "Transactions" }]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">Monitor all platform financial activity</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} {...fadeIn(i)}>
              <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Transaction History</h3>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="earning">Earning</SelectItem>
                <SelectItem value="redemption">Redemption</SelectItem>
                <SelectItem value="purchase">Purchase</SelectItem>
                <SelectItem value="payout">Payout</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No transactions found.</div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Description</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-right p-3 font-medium">Points</th>
                <th className="text-right p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const u = profiles[t.user_id];
                return (
                  <motion.tr key={t.id} {...fadeIn(i)} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3 text-foreground">{u?.full_name || u?.email || "—"}</td>
                    <td className="p-3"><Badge className={`text-xs ${typeColors[t.type] || ""}`}>{t.type}</Badge></td>
                    <td className="p-3 text-muted-foreground">{t.description || "-"}</td>
                    <td className="p-3"><Badge className={`text-xs ${statusColors[t.status] || ""}`}>{t.status}</Badge></td>
                    <td className="p-3 text-muted-foreground text-xs">{new Date(t.created_at).toLocaleString()}</td>
                    <td className="p-3 text-right font-medium text-foreground">${Number(t.amount).toFixed(2)}</td>
                    <td className="p-3 text-right text-muted-foreground">{t.points > 0 ? `+${t.points}` : t.points}</td>
                    <td className="p-3 text-right">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(t)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this transaction record?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the ledger entry only — it does not reverse any points or balances already applied. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminTransactions;
