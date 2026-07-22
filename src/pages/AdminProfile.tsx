import { useCallback, useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, Key, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const AdminProfile = () => {
  const { user, updatePassword } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", bio: "" });
  const [passwords, setPasswords] = useState({ next: "", confirm: "" });
  const [changingPassword, setChangingPassword] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      setProfile(data);
      setForm({ full_name: data.full_name || "", phone: data.phone || "", bio: data.bio || "" });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(form).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    load();
  };

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

  const initial = (profile?.full_name || profile?.email || "A").charAt(0).toUpperCase();

  if (loading) {
    return (
      <AdminLayout title="Profile">
        <div className="p-16 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading profile…
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Profile">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">Your admin account details.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6 glass-lg border-border/30 lg:col-span-1 text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
            {initial}
          </div>
          <h3 className="font-bold text-lg">{profile?.full_name || "Unnamed"}</h3>
          <p className="text-sm text-muted-foreground mb-3">{profile?.email}</p>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1">
            <ShieldCheck className="w-3 h-3" /> Administrator
          </Badge>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <Card className="p-6 glass-lg border-border/30 space-y-4">
            <h3 className="font-semibold text-foreground">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="mt-1.5 bg-background/50" /></div>
              <div><Label>Email</Label><Input value={profile?.email || ""} disabled className="mt-1.5 bg-background/50 opacity-60" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1.5 bg-background/50" /></div>
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} className="mt-1.5 bg-background/50" />
            </div>
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving} className="bg-gradient-primary text-primary-foreground">
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </Card>

          <Card className="p-6 glass-lg border-border/30 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2"><Key className="w-4 h-4 text-primary" /> Change Password</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>New Password</Label><Input type="password" value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} className="mt-1.5 bg-background/50" /></div>
              <div><Label>Confirm Password</Label><Input type="password" value={passwords.confirm} onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))} className="mt-1.5 bg-background/50" /></div>
            </div>
            <div className="flex justify-end">
              <Button onClick={changePassword} disabled={changingPassword} variant="outline">
                {changingPassword ? "Updating…" : "Update Password"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
