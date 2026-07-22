import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Users, Search, Plus, Shield, ShieldOff, Trash2, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

const fadeIn = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserRow extends Profile {
  role: "admin" | "user";
  gadgetCount: number;
}

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  user: "bg-muted text-muted-foreground border-border",
};

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: "", email: "", password: "", role: "user" as "admin" | "user" });

  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: profiles, error: profErr }, { data: roles }, { data: gadgets }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("gadgets").select("user_id"),
    ]);
    if (profErr) {
      toast.error(profErr.message);
      setLoading(false);
      return;
    }
    const adminIds = new Set((roles || []).filter((r) => r.role === "admin").map((r) => r.user_id));
    const gadgetCounts = new Map<string, number>();
    (gadgets || []).forEach((g) => gadgetCounts.set(g.user_id, (gadgetCounts.get(g.user_id) || 0) + 1));

    setUsers(
      (profiles || []).map((p) => ({
        ...p,
        role: adminIds.has(p.id) ? "admin" : "user",
        gadgetCount: gadgetCounts.get(p.id) || 0,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin").length;
    const totalPoints = users.reduce((sum, u) => sum + u.points, 0);
    return [
      { label: "Total Users", value: String(total) },
      { label: "Admins", value: String(admins) },
      { label: "Standard Users", value: String(total - admins) },
      { label: "Total Points Issued", value: totalPoints.toLocaleString() },
    ];
  }, [users]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = (u.full_name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleRole = async (u: UserRow) => {
    setBusyId(u.id);
    const makeAdmin = u.role !== "admin";
    const { error } = await supabase.rpc("admin_set_user_role", { _user_id: u.id, _role: "admin", _grant: makeAdmin });
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(makeAdmin ? `${u.full_name || u.email} is now an admin` : `${u.full_name || u.email} is no longer an admin`);
    load();
  };

  const openAdd = () => {
    setAddForm({ full_name: "", email: "", password: "", role: "user" });
    setAddOpen(true);
  };

  const handleAdd = async () => {
    if (!addForm.email || !addForm.password) return toast.error("Email and password are required");
    if (addForm.password.length < 6) return toast.error("Password must be at least 6 characters");
    setAdding(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: addForm,
      headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
    });
    setAdding(false);
    if (error || data?.error) return toast.error(data?.error || error?.message || "Failed to create user");
    toast.success("User created");
    setAddOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.rpc("admin_delete_user", { _user_id: deleteTarget.id });
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success("User deleted");
    setDeleteTarget(null);
    load();
  };

  return (
    <AdminLayout title="Users" breadcrumbs={[{ label: "Content" }, { label: "Users" }]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage platform users and permissions</p>
        </div>
        <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" />Add User</Button>
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
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
              No users found.
            </div>
          ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3 font-medium">User</th>
                <th className="text-left p-3 font-medium">Role</th>
                <th className="text-left p-3 font-medium">Points</th>
                <th className="text-left p-3 font-medium">Joined</th>
                <th className="text-right p-3 font-medium">Gadgets</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <motion.tr key={u.id} {...fadeIn(i)} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="p-3">
                    <div><span className="text-foreground font-medium">{u.full_name || "—"}</span></div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="p-3"><Badge className={`text-xs ${roleColors[u.role]}`}>{u.role}</Badge></td>
                  <td className="p-3 text-foreground">{u.points.toLocaleString()}</td>
                  <td className="p-3 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="p-3 text-right text-foreground">{u.gadgetCount}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost" size="sm" disabled={busyId === u.id || u.id === currentUser?.id}
                        title={u.role === "admin" ? "Revoke admin" : "Make admin"}
                        onClick={() => toggleRole(u)}
                      >
                        {u.role === "admin" ? <ShieldOff className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="text-destructive hover:text-destructive"
                        disabled={u.id === currentUser?.id}
                        title="Delete user"
                        onClick={() => setDeleteTarget(u)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Full name</Label>
              <Input value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Email</Label>
              <Input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Password</Label>
              <Input type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Role</Label>
              <Select value={addForm.role} onValueChange={(v: "admin" | "user") => setAddForm({ ...addForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={adding} className="bg-gradient-primary text-primary-foreground">
              {adding ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.full_name || deleteTarget?.email}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes their account, gadgets, transactions, and all related data. This cannot be undone.
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

export default AdminUsers;
