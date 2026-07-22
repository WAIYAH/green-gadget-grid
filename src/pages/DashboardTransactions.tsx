import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

const statusColor: Record<string, string> = {
  completed: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-accent/15 text-accent border-accent/30",
  failed: "bg-destructive/15 text-destructive border-destructive/30",
};

const DashboardTransactions = () => {
  const { user } = useAuth();
  const [tx, setTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setTx(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = tx.filter(
    (t) => (filter === "All" || t.type === filter.toLowerCase()) &&
      (t.description || "").toLowerCase().includes(q.toLowerCase())
  );

  const { totalEarned, totalSpent, net } = useMemo(() => {
    const earned = tx.filter((t) => t.points > 0).reduce((s, t) => s + t.points, 0);
    const spent = Math.abs(tx.filter((t) => t.points < 0).reduce((s, t) => s + t.points, 0));
    return { totalEarned: earned, totalSpent: spent, net: earned - spent };
  }, [tx]);

  const exportCsv = () => {
    const csv = ["ID,Type,Description,Points,Amount,Date,Status", ...tx.map((t) => `${t.id},${t.type},"${t.description || ""}",${t.points},${t.amount},${t.created_at},${t.status}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "transactions.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported transactions.csv");
  };

  return (
    <DashboardLayout title="Transactions">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-sm text-muted-foreground">All earnings, redemptions, and purchases in one place.</p>
        </div>
        <Button onClick={exportCsv} variant="outline" className="border-border/50">
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <Card className="p-4 glass-lg border-border/30">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Earned</p>
          <p className="text-2xl font-bold text-primary mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-5 h-5" /> {totalEarned.toLocaleString()} pts
          </p>
        </Card>
        <Card className="p-4 glass-lg border-border/30">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Spent</p>
          <p className="text-2xl font-bold text-destructive mt-1 flex items-center gap-1">
            <ArrowDownRight className="w-5 h-5" /> {totalSpent.toLocaleString()} pts
          </p>
        </Card>
        <Card className="p-4 glass-lg border-border/30">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Net Balance</p>
          <p className="text-2xl font-bold text-foreground mt-1">{net.toLocaleString()} pts</p>
        </Card>
      </div>

      <Card className="glass-lg border-border/30">
        <div className="p-4 border-b border-border/20 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9 bg-background/50" />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="Earning">Earnings</TabsTrigger>
              <TabsTrigger value="Redemption">Redemptions</TabsTrigger>
              <TabsTrigger value="Purchase">Purchases</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading transactions…
          </div>
        ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell><Badge variant="outline" className="border-border/40 capitalize">{t.type}</Badge></TableCell>
                  <TableCell className="text-foreground">{t.description || "-"}</TableCell>
                  <TableCell className={`font-semibold ${t.points > 0 ? "text-primary" : t.points < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                    {t.points > 0 ? "+" : ""}{t.points.toLocaleString()} pts
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="outline" className={`capitalize ${statusColor[t.status] || ""}`}>{t.status}</Badge></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No transactions found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default DashboardTransactions;
