import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, Check, Mail, Smartphone, MessageSquare, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

const PREFS_INIT = [
  { category: "Listing updates", email: true, push: true, sms: false },
  { category: "Swap notifications", email: true, push: true, sms: true },
  { category: "Reward offers", email: true, push: false, sms: false },
  { category: "Weekly impact digest", email: true, push: false, sms: false },
  { category: "Product announcements", email: false, push: false, sms: false },
];

const catColor: Record<string, string> = {
  success: "bg-primary/15 text-primary border-primary/30",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  warning: "bg-accent/15 text-accent border-accent/30",
  error: "bg-destructive/15 text-destructive border-destructive/30",
};

const timeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
};

const DashboardNotifications = () => {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState(PREFS_INIT);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    setNotifs(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const markAllRead = async () => {
    if (!user) return;
    const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    if (error) return toast.error(error.message);
    toast.success("All marked as read");
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setNotifs((p) => p.filter((n) => n.id !== id));
  };

  const toggleRead = async (n: Notification) => {
    const { error } = await supabase.from("notifications").update({ read: !n.read }).eq("id", n.id);
    if (error) return toast.error(error.message);
    setNotifs((p) => p.map((x) => x.id === n.id ? { ...x, read: !x.read } : x));
  };

  const setPref = (i: number, key: "email" | "push" | "sms", v: boolean) =>
    setPrefs((p) => p.map((row, idx) => idx === i ? { ...row, [key]: v } : row));

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <DashboardLayout title="Notifications">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Notifications {unread > 0 && <Badge className="bg-destructive text-destructive-foreground">{unread} new</Badge>}
          </h1>
          <p className="text-sm text-muted-foreground">Stay updated on your listings, swaps, and rewards.</p>
        </div>
        <Button variant="outline" onClick={markAllRead} disabled={unread === 0} className="border-border/50">
          <Check className="w-4 h-4 mr-2" /> Mark all read
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Inbox */}
        <Card className="lg:col-span-2 glass-lg border-border/30 overflow-hidden">
          <div className="p-4 border-b border-border/20 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h2 className="font-semibold">Inbox</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : (
          <div className="divide-y divide-border/10 max-h-[600px] overflow-y-auto">
            {notifs.map((n) => (
              <div key={n.id} className={`p-4 hover:bg-muted/30 transition-colors ${!n.read ? "bg-primary/5" : ""}`}>
                <div className="flex items-start gap-3">
                  {!n.read && <div className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />}
                  <div className={`flex-1 min-w-0 ${n.read ? "ml-5" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{n.title}</p>
                      <Badge variant="outline" className={`text-[10px] capitalize ${catColor[n.type] || ""}`}>{n.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => toggleRead(n)}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="w-8 h-8 text-destructive" onClick={() => remove(n.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {notifs.length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">No notifications.</div>}
          </div>
          )}
        </Card>

        {/* Preferences */}
        <Card className="p-5 glass-lg border-border/30">
          <h2 className="font-semibold mb-1">Preferences</h2>
          <p className="text-xs text-muted-foreground mb-4">Choose where to receive each type of update.</p>
          <div className="space-y-4">
            {prefs.map((row, i) => (
              <div key={row.category} className="pb-3 border-b border-border/10 last:border-0">
                <p className="text-sm font-medium text-foreground mb-2">{row.category}</p>
                <div className="space-y-2">
                  {[
                    { key: "email" as const, icon: Mail, label: "Email" },
                    { key: "push" as const, icon: Smartphone, label: "Push" },
                    { key: "sms" as const, icon: MessageSquare, label: "SMS" },
                  ].map(({ key, icon: Icon, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </span>
                      <Switch checked={row[key]} onCheckedChange={(v) => setPref(i, key, v)} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardNotifications;
