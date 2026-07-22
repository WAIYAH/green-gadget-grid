import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, Smartphone, CreditCard, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const toCsv = (rows: Record<string, unknown>[]): string => {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
};

const downloadCsv = (filename: string, rows: Record<string, unknown>[]) => {
  const blob = new Blob([toCsv(rows)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const REPORTS = [
  {
    key: "users",
    name: "Users",
    desc: "All accounts — name, email, points, tier, join date",
    icon: Users,
    fetch: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, email, points, tier, co2_saved, created_at");
      return data || [];
    },
  },
  {
    key: "gadgets",
    name: "Gadget Submissions",
    desc: "Every submission — status, category, condition, value",
    icon: Smartphone,
    fetch: async () => {
      const { data } = await supabase.from("gadgets").select("id, name, brand, category, condition, status, points_value, cash_value, user_id, created_at");
      return data || [];
    },
  },
  {
    key: "transactions",
    name: "Transactions",
    desc: "Full points/cash ledger across all users",
    icon: CreditCard,
    fetch: async () => {
      const { data } = await supabase.from("transactions").select("id, user_id, type, amount, points, status, description, created_at");
      return data || [];
    },
  },
  {
    key: "orders",
    name: "Orders",
    desc: "Swap Center redemptions — item, payment method, status",
    icon: Package,
    fetch: async () => {
      const { data } = await supabase.from("orders").select("id, user_id, item_id, quantity, payment_method, total_points, total_amount, status, created_at");
      return data || [];
    },
  },
];

const AdminReports = () => {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (report: (typeof REPORTS)[number]) => {
    setExporting(report.key);
    try {
      const rows = await report.fetch();
      if (rows.length === 0) {
        toast.error(`No ${report.name.toLowerCase()} to export`);
        return;
      }
      downloadCsv(`${report.key}.csv`, rows as Record<string, unknown>[]);
      toast.success(`Exported ${report.key}.csv (${rows.length} rows)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(null);
    }
  };

  return (
    <AdminLayout title="Reports" breadcrumbs={[{ label: "Core" }, { label: "Reports" }]}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Export live platform data as CSV.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REPORTS.map((r) => {
          const Icon = r.icon;
          const isExporting = exporting === r.key;
          return (
            <Card key={r.key} className="p-5 border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{r.name}</h4>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" disabled={isExporting} onClick={() => handleExport(r)} className="shrink-0">
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              </Button>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
