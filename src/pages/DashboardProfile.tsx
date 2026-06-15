import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, Save, Twitter, Linkedin, Github, Globe } from "lucide-react";
import { toast } from "sonner";

const DashboardProfile = () => {
  const [form, setForm] = useState({
    firstName: "Triple", lastName: "G User", email: "user@tripleG.com",
    phone: "+1 555 0199", city: "San Francisco", country: "USA",
    bio: "Sustainability advocate. Recycling one gadget at a time. 🌱",
    twitter: "@tripleg_user", linkedin: "tripleg-user", github: "triplegdev", website: "tripleg.dev",
  });

  const set = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <DashboardLayout title="Profile">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal information and social presence.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Avatar card */}
        <Card className="p-6 glass-lg border-border/30 lg:col-span-1 text-center">
          <div className="relative w-28 h-28 mx-auto mb-4">
            <div className="w-full h-full rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-4xl font-bold">
              U
            </div>
            <button className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center text-foreground hover:bg-muted">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-bold text-lg">{form.firstName} {form.lastName}</h3>
          <p className="text-sm text-muted-foreground mb-3">{form.email}</p>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Silver Tier</Badge>
          <div className="mt-5 pt-5 border-t border-border/20 grid grid-cols-3 gap-2 text-center">
            <div><p className="text-xl font-bold text-foreground">12</p><p className="text-[11px] text-muted-foreground">Listings</p></div>
            <div><p className="text-xl font-bold text-foreground">5</p><p className="text-[11px] text-muted-foreground">Swaps</p></div>
            <div><p className="text-xl font-bold text-primary">87kg</p><p className="text-[11px] text-muted-foreground">CO₂</p></div>
          </div>
        </Card>

        {/* Form */}
        <Card className="p-6 glass-lg border-border/30 lg:col-span-2 space-y-5">
          <div>
            <h3 className="font-semibold text-foreground mb-3">Personal Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>First Name</Label><Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} className="mt-1.5 bg-background/50" /></div>
              <div><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} className="mt-1.5 bg-background/50" /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="mt-1.5 bg-background/50" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="mt-1.5 bg-background/50" /></div>
              <div><Label>City</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} className="mt-1.5 bg-background/50" /></div>
              <div><Label>Country</Label><Input value={form.country} onChange={(e) => set("country", e.target.value)} className="mt-1.5 bg-background/50" /></div>
            </div>
          </div>

          <div>
            <Label>Bio (Markdown supported)</Label>
            <Textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} className="mt-1.5 bg-background/50" />
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">Social Links</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label className="flex items-center gap-1.5"><Twitter className="w-3.5 h-3.5" /> Twitter</Label><Input value={form.twitter} onChange={(e) => set("twitter", e.target.value)} className="mt-1.5 bg-background/50" /></div>
              <div><Label className="flex items-center gap-1.5"><Linkedin className="w-3.5 h-3.5" /> LinkedIn</Label><Input value={form.linkedin} onChange={(e) => set("linkedin", e.target.value)} className="mt-1.5 bg-background/50" /></div>
              <div><Label className="flex items-center gap-1.5"><Github className="w-3.5 h-3.5" /> GitHub</Label><Input value={form.github} onChange={(e) => set("github", e.target.value)} className="mt-1.5 bg-background/50" /></div>
              <div><Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Website</Label><Input value={form.website} onChange={(e) => set("website", e.target.value)} className="mt-1.5 bg-background/50" /></div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={() => toast.success("Profile updated")} className="bg-gradient-primary text-primary-foreground">
              <Save className="w-4 h-4 mr-2" /> Save Changes
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardProfile;
