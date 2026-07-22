import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const DashboardProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [listingCount, setListingCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [form, setForm] = useState({ full_name: "", phone: "", location: "", bio: "" });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: profileRow }, { count: gadgetCount }, { count: ordersCount }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("gadgets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    if (profileRow) {
      setProfile(profileRow);
      setForm({
        full_name: profileRow.full_name || "",
        phone: profileRow.phone || "",
        location: profileRow.location || "",
        bio: profileRow.bio || "",
      });
    }
    setListingCount(gadgetCount || 0);
    setOrderCount(ordersCount || 0);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name,
      phone: form.phone,
      location: form.location,
      bio: form.bio,
    }).eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    load();
  };

  const initial = (profile?.full_name || profile?.email || "U").charAt(0).toUpperCase();

  if (loading) {
    return (
      <DashboardLayout title="Profile">
        <div className="p-16 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading profile…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Profile">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Avatar card */}
        <Card className="p-6 glass-lg border-border/30 lg:col-span-1 text-center">
          <div className="relative w-28 h-28 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-4xl font-bold">
              {initial}
            </div>
          </div>
          <h3 className="font-bold text-lg">{profile?.full_name || "Unnamed"}</h3>
          <p className="text-sm text-muted-foreground mb-3">{profile?.email}</p>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{profile?.tier || "Bronze"} Tier</Badge>
          <div className="mt-5 pt-5 border-t border-border/20 grid grid-cols-3 gap-2 text-center">
            <div><p className="text-xl font-bold text-foreground">{listingCount}</p><p className="text-[11px] text-muted-foreground">Listings</p></div>
            <div><p className="text-xl font-bold text-foreground">{orderCount}</p><p className="text-[11px] text-muted-foreground">Orders</p></div>
            <div><p className="text-xl font-bold text-primary">{Number(profile?.co2_saved ?? 0).toFixed(0)}kg</p><p className="text-[11px] text-muted-foreground">CO₂</p></div>
          </div>
        </Card>

        {/* Form */}
        <Card className="p-6 glass-lg border-border/30 lg:col-span-2 space-y-5">
          <div>
            <h3 className="font-semibold text-foreground mb-3">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className="mt-1.5 bg-background/50" /></div>
              <div><Label>Email</Label><Input type="email" value={profile?.email || ""} disabled className="mt-1.5 bg-background/50 opacity-60" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1.5 bg-background/50" /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => set("location", e.target.value)} className="mt-1.5 bg-background/50" /></div>
            </div>
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} className="mt-1.5 bg-background/50" />
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={save} disabled={saving} className="bg-gradient-primary text-primary-foreground">
              <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardProfile;
