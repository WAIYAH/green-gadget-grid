import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Smartphone, Search, CheckCircle, XCircle, Clock, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const fadeIn = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

type Gadget = Database["public"]["Tables"]["gadgets"]["Row"];
type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email">;

const statusConfig: Record<Gadget["status"], { color: string; icon: typeof CheckCircle }> = {
  approved: { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle },
  pending: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock },
  rejected: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle },
  sold: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: CheckCircle },
};

const AdminGadgets = () => {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [gadgets, setGadgets] = useState<Gadget[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Gadget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("gadgets").select("*").order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const rows = data || [];
    setGadgets(rows);

    const userIds = Array.from(new Set(rows.map((g) => g.user_id)));
    if (userIds.length) {
      const { data: profileRows } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const map: Record<string, Profile> = {};
      (profileRows || []).forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const total = gadgets.length;
    const pending = gadgets.filter((g) => g.status === "pending").length;
    const approved = gadgets.filter((g) => g.status === "approved").length;
    const rejected = gadgets.filter((g) => g.status === "rejected").length;
    const rejectionRate = total ? ((rejected / total) * 100).toFixed(1) : "0.0";
    return [
      { label: "Total Gadgets", value: String(total), up: true },
      { label: "Pending Review", value: String(pending), up: false },
      { label: "Approved", value: String(approved), up: true },
      { label: "Rejection Rate", value: `${rejectionRate}%`, up: true },
    ];
  }, [gadgets]);

  const filtered = gadgets.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase()) || (g.brand || "").toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === "all" || g.status === tab;
    return matchSearch && matchTab;
  });

  const handleApprove = async (id: string) => {
    setActioningId(id);
    const { error } = await supabase.rpc("approve_gadget", { _gadget_id: id });
    setActioningId(null);
    if (error) return toast.error(error.message);
    toast.success("Gadget approved — points credited to submitter");
    load();
  };

  const handleReject = async (id: string) => {
    setActioningId(id);
    const { error } = await supabase.rpc("reject_gadget", { _gadget_id: id });
    setActioningId(null);
    if (error) return toast.error(error.message);
    toast.success("Gadget rejected");
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("gadgets").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success("Gadget deleted");
    setDeleteTarget(null);
    load();
  };

  return (
    <AdminLayout title="Gadgets" breadcrumbs={[{ label: "Content" }, { label: "Gadgets" }]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gadget Management</h1>
          <p className="text-sm text-muted-foreground">Review and manage gadget submissions</p>
        </div>
        <Button size="sm"><Smartphone className="h-4 w-4 mr-1" />Export</Button>
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

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search gadgets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading gadgets…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No gadgets found.</div>
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3 font-medium">Gadget</th>
                <th className="text-left p-3 font-medium">Condition</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Submitter</th>
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-right p-3 font-medium">Points</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => {
                const sc = statusConfig[g.status];
                const StatusIcon = sc.icon;
                const submitter = profiles[g.user_id];
                return (
                  <motion.tr key={g.id} {...fadeIn(i)} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="p-3">
                      <div className="text-foreground font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground">{g.brand}</div>
                    </td>
                    <td className="p-3 text-muted-foreground capitalize">{g.condition}</td>
                    <td className="p-3"><Badge className={`text-xs gap-1 ${sc.color}`}><StatusIcon className="h-3 w-3" />{g.status}</Badge></td>
                    <td className="p-3 text-muted-foreground">{submitter?.full_name || submitter?.email || "—"}</td>
                    <td className="p-3 text-muted-foreground">{new Date(g.created_at).toLocaleDateString()}</td>
                    <td className="p-3 text-right text-foreground font-medium">{g.points_value} pts</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        {g.status === "pending" && (
                          <>
                            <Button
                              variant="ghost" size="sm" disabled={actioningId === g.id}
                              className="text-green-500 hover:text-green-600"
                              onClick={() => handleApprove(g.id)}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost" size="sm" disabled={actioningId === g.id}
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleReject(g.id)}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(g)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the gadget submission. This cannot be undone.</AlertDialogDescription>
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

export default AdminGadgets;
