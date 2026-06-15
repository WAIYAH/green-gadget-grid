import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";

interface Tx {
  id: string;
  type: "Earning" | "Redemption" | "Swap" | "Refund";
  description: string;
  amount: number;
  date: string;
  status: "Completed" | "Pending" | "Failed";
}

const TX: Tx[] = [
  { id: "TX-1041", type: "Earning", description: "iPhone 12 — Approved", amount: 850, date: "2025-12-15", status: "Completed" },
  { id: "TX-1040", type: "Redemption", description: "Amazon Gift Card $25", amount: -2500, date: "2025-12-12", status: "Completed" },
  { id: "TX-1039", type: "Swap", description: "Sony WH-1000XM4", amount: -1800, date: "2025-12-08", status: "Completed" },
  { id: "TX-1038", type: "Earning", description: "MacBook Air — Sold", amount: 1800, date: "2025-11-10", status: "Completed" },
  { id: "TX-1037", type: "Earning", description: "AirPods Pro — Approved", amount: 480, date: "2025-11-28", status: "Completed" },
  { id: "TX-1036", type: "Refund", description: "Cancelled swap refund", amount: 320, date: "2025-11-04", status: "Pending" },
  { id: "TX-1035", type: "Earning", description: "Pickup bonus", amount: 100, date: "2025-10-30", status: "Completed" },
];

const statusColor = {
  Completed: "bg-primary/15 text-primary border-primary/30",
  Pending: "bg-accent/15 text-accent border-accent/30",
  Failed: "bg-destructive/15 text-destructive border-destructive/30",
};

const DashboardTransactions = () => {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = TX.filter(
    (t) => (filter === "All" || t.type === filter) && (t.description.toLowerCase().includes(q.toLowerCase()) || t.id.includes(q))
  );

  const totalEarned = TX.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalSpent = Math.abs(TX.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));
  const net = totalEarned - totalSpent;

  const exportCsv = () => {
    const csv = ["ID,Type,Description,Amount,Date,Status", ...TX.map((t) => `${t.id},${t.type},"${t.description}",${t.amount},${t.date},${t.status}`)].join("\n");
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
          <p className="text-sm text-muted-foreground">All earnings, redemptions, swaps, and refunds in one place.</p>
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
              <TabsTrigger value="Swap">Swaps</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{t.id}</TableCell>
                  <TableCell><Badge variant="outline" className="border-border/40">{t.type}</Badge></TableCell>
                  <TableCell className="text-foreground">{t.description}</TableCell>
                  <TableCell className={`font-semibold ${t.amount > 0 ? "text-primary" : "text-destructive"}`}>
                    {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()} pts
                  </TableCell>
                  <TableCell className="text-muted-foreground">{new Date(t.date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="outline" className={statusColor[t.status]}>{t.status}</Badge></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No transactions found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default DashboardTransactions;
