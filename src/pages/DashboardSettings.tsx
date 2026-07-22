import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Key, Trash2, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const DashboardSettings = () => {
  const navigate = useNavigate();
  const { updatePassword, signOut } = useAuth();
  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const changePassword = async () => {
    if (passwords.next.length < 6) return toast.error("Password must be at least 6 characters");
    if (passwords.next !== passwords.confirm) return toast.error("Passwords don't match");
    setChangingPassword(true);
    const { error } = await updatePassword(passwords.next);
    setChangingPassword(false);
    if (error) return toast.error(error.message);
    setPasswords({ next: "", confirm: "" });
    toast.success("Password updated");
  };

  const deleteAccount = async () => {
    setDeleting(true);
    const { error } = await supabase.rpc("self_delete_account");
    if (error) {
      setDeleting(false);
      toast.error(error.message);
      return;
    }
    await signOut();
    toast.success("Account deleted");
    navigate("/");
  };

  return (
    <DashboardLayout title="Settings">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account security and data.</p>
      </div>

      <div className="space-y-5 max-w-4xl">
        <Card className="p-6 glass-lg border-border/30">
          <h2 className="font-semibold flex items-center gap-2 mb-1"><Key className="w-4 h-4 text-primary" /> Password</h2>
          <p className="text-xs text-muted-foreground mb-4">Update your account password.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>New Password</Label>
              <Input type="password" className="mt-1.5 bg-background/50" value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} />
            </div>
            <div>
              <Label>Confirm Password</Label>
              <Input type="password" className="mt-1.5 bg-background/50" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} />
            </div>
          </div>
          <Button onClick={changePassword} disabled={changingPassword} className="mt-4 bg-gradient-primary text-primary-foreground">
            <Save className="w-4 h-4 mr-2" /> {changingPassword ? "Updating…" : "Update Password"}
          </Button>
        </Card>

        <Card className="p-6 glass-lg border border-destructive/30">
          <h2 className="font-semibold flex items-center gap-2 mb-1 text-destructive">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Irreversible actions. Proceed with caution.</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently removes your account, submissions, and transaction history.</p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
            </Button>
          </div>
        </Card>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes your account, gadget submissions, and transaction history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Deleting…" : "Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DashboardSettings;
