import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { MessageSquare, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const fadeIn = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email">;

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-500 border-red-500/20",
  high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  low: "bg-muted text-muted-foreground border-border",
};

const statusColors: Record<Ticket["status"], string> = {
  open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  closed: "bg-green-500/10 text-green-500 border-green-500/20",
};

const AdminTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = data || [];
    setTickets(rows);
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

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === "open").length;
    const inProgress = tickets.filter((t) => t.status === "in_progress").length;
    const closed = tickets.filter((t) => t.status === "closed").length;
    return [
      { label: "Open Tickets", value: String(open) },
      { label: "In Progress", value: String(inProgress) },
      { label: "Closed", value: String(closed) },
      { label: "Total", value: String(tickets.length) },
    ];
  }, [tickets]);

  const setStatus = async (id: string, status: Ticket["status"]) => {
    setBusyId(id);
    const { error } = await supabase.from("tickets").update({ status }).eq("id", id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`Ticket marked ${status.replace("_", " ")}`);
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("tickets").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success("Ticket deleted");
    setDeleteTarget(null);
    load();
  };

  return (
    <AdminLayout title="Tickets" breadcrumbs={[{ label: "Support" }, { label: "Tickets" }]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>
          <p className="text-sm text-muted-foreground">Manage customer support requests</p>
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

      <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="p-4 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">All Tickets</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading tickets…
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No tickets yet.</div>
        ) : (
        <div className="divide-y divide-border/50">
          {tickets.map((t, i) => {
            const submitter = profiles[t.user_id];
            return (
              <motion.div key={t.id} {...fadeIn(i)} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className={`text-xs ${priorityColors[t.priority] || priorityColors.medium}`}>{t.priority}</Badge>
                      <Badge className={`text-xs ${statusColors[t.status]}`}>{t.status.replace("_", " ")}</Badge>
                    </div>
                    <h4 className="text-sm font-medium text-foreground">{t.subject}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{t.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {submitter?.full_name || submitter?.email || "—"} · {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageSquare className="h-3 w-3" />{t.replies}
                    </div>
                    <Select value={t.status} disabled={busyId === t.id} onValueChange={(v: Ticket["status"]) => setStatus(t.id, v)}>
                      <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(t)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        )}
      </Card>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ticket "{deleteTarget?.subject}"?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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

export default AdminTickets;
