import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Trash2, Eye, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Listing {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  condition: string;
  points_value: number;
  status: string;
  created_at: string;
}

const statusColor: Record<string, string> = {
  pending: "bg-accent/15 text-accent border-accent/30",
  approved: "bg-primary/15 text-primary border-primary/30",
  sold: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
};

const DashboardListings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Listing[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("gadgets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Listing[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = items.filter(
    (i) =>
      (filter === "all" || i.status === filter) &&
      (i.name.toLowerCase().includes(q.toLowerCase()) || (i.brand || "").toLowerCase().includes(q.toLowerCase()))
  );

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("gadgets").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setItems((p) => p.filter((i) => i.id !== id));
    toast.success("Listing deleted");
  };

  return (
    <DashboardLayout title="My Listings">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Listings</h1>
          <p className="text-sm text-muted-foreground">Manage gadgets you've submitted for recycling or sale.</p>
        </div>
        <Button onClick={() => navigate("/submit-gadget")} className="bg-gradient-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Submit Gadget
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total", value: items.length },
          { label: "Approved", value: items.filter((i) => i.status === "approved").length },
          { label: "Pending", value: items.filter((i) => i.status === "pending").length },
          { label: "Sold", value: items.filter((i) => i.status === "sold").length },
        ].map((s) => (
          <Card key={s.label} className="p-4 glass-lg border-border/30">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="glass-lg border-border/30">
        <div className="p-4 border-b border-border/20 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listings…" className="pl-9 bg-background/50" />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="sold">Sold</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Points</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>}
              {!loading && filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{l.name}</p>
                        <p className="text-xs text-muted-foreground">{l.brand}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{l.category}</TableCell>
                  <TableCell className="text-muted-foreground">{l.condition}</TableCell>
                  <TableCell className="font-semibold text-primary">{l.points_value.toLocaleString()}</TableCell>
                  <TableCell className="text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColor[l.status] || ""}>{l.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => toast.info(`Viewing ${l.name}`)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive" onClick={() => handleDelete(l.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No listings yet. Submit your first gadget!</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </DashboardLayout>
  );
};

export default DashboardListings;
