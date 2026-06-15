import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, Check, Mail, Smartphone, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Notif {
  id: number;
  title: string;
  body: string;
  category: "Listing" | "Swap" | "Reward" | "System";
  time: string;
  read: boolean;
}

const SEED: Notif[] = [
  { id: 1, title: "Listing approved", body: "Your iPhone 12 has been approved (+850 pts)", category: "Listing", time: "5m ago", read: false },
  { id: 2, title: "Swap shipped", body: "Sony WH-1000XM4 is on its way (FDX67890)", category: "Swap", time: "1h ago", read: false },
  { id: 3, title: "Silver tier unlocked", body: "Congratulations! You've reached Silver tier.", category: "Reward", time: "Yesterday", read: false },
  { id: 4, title: "Pickup scheduled", body: "Pickup confirmed for Friday 2 PM.", category: "Listing", time: "2d ago", read: true },
  { id: 5, title: "Welcome to Triple G", body: "Submit your first gadget to earn 100 bonus points!", category: "System", time: "1w ago", read: true },
];

const PREFS_INIT = [
  { category: "Listing updates", email: true, push: true, sms: false },
  { category: "Swap notifications", email: true, push: true, sms: true },
  { category: "Reward offers", email: true, push: false, sms: false },
  { category: "Weekly impact digest", email: true, push: false, sms: false },
  { category: "Product announcements", email: false, push: false, sms: false },
];

const catColor = {
  Listing: "bg-primary/15 text-primary border-primary/30",
  Swap: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  Reward: "bg-accent/15 text-accent border-accent/30",
  System: "bg-muted/30 text-muted-foreground border-border/30",
};

const DashboardNotifications = () => {
  const [notifs, setNotifs] = useState<Notif[]>(SEED);
  const [prefs, setPrefs] = useState(PREFS_INIT);

  const markAllRead = () => { setNotifs((p) => p.map((n) => ({ ...n, read: true }))); toast.success("All marked as read"); };
  const remove = (id: number) => setNotifs((p) => p.filter((n) => n.id !== id));
  const toggleRead = (id: number) => setNotifs((p) => p.map((n) => n.id === id ? { ...n, read: !n.read } : n));
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
        <Button variant="outline" onClick={markAllRead} className="border-border/50">
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
          <div className="divide-y divide-border/10 max-h-[600px] overflow-y-auto">
            {notifs.map((n) => (
              <div key={n.id} className={`p-4 hover:bg-muted/30 transition-colors ${!n.read ? "bg-primary/5" : ""}`}>
                <div className="flex items-start gap-3">
                  {!n.read && <div className="mt-2 w-2 h-2 rounded-full bg-primary shrink-0" />}
                  <div className={`flex-1 min-w-0 ${n.read ? "ml-5" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-foreground">{n.title}</p>
                      <Badge variant="outline" className={`text-[10px] ${catColor[n.category]}`}>{n.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="text-[11px] text-muted-foreground/60 mt-1">{n.time}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="w-8 h-8" onClick={() => toggleRead(n.id)}>
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
