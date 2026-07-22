import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Server, Database, Megaphone, Users, FileBarChart, ArrowRight, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const IS_LOCAL = SUPABASE_URL?.includes("127.0.0.1") || SUPABASE_URL?.includes("localhost");

const QUICK_LINKS = [
  { label: "Post a platform announcement", desc: "Publishes to the public Awareness page and every dashboard.", icon: Megaphone, path: "/admin/announcements" },
  { label: "Manage admins & users", desc: "Promote/demote roles, create accounts, remove users.", icon: Users, path: "/admin/users" },
  { label: "Export platform data", desc: "Download users, gadgets, transactions, and orders as CSV.", icon: FileBarChart, path: "/admin/reports" },
];

const AdminSettings = () => {
  const navigate = useNavigate();

  return (
    <AdminLayout title="System">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">System</h1>
        <p className="text-sm text-muted-foreground">Environment info and the platform-wide controls that actually exist today.</p>
      </div>

      <Card className="p-5 border-border/50 bg-card/80 backdrop-blur-sm mb-4">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Server className="h-4 w-4" /> Environment
        </h3>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
            <span className="text-muted-foreground flex items-center gap-2"><Database className="h-3.5 w-3.5" /> Supabase project</span>
            <Badge variant="outline" className={IS_LOCAL ? "text-yellow-500 border-yellow-500/30" : "text-primary border-primary/30"}>
              {IS_LOCAL ? "Local dev" : "Remote"}
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
            <span className="text-muted-foreground flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Row Level Security</span>
            <Badge variant="outline" className="text-primary border-primary/30">Enforced on every table</Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 font-mono break-all">{SUPABASE_URL}</p>
      </Card>

      <div className="grid gap-3">
        {QUICK_LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Card key={l.path} className="p-4 border-border/50 bg-card/80 backdrop-blur-sm flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{l.label}</p>
                  <p className="text-xs text-muted-foreground">{l.desc}</p>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate(l.path)}>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Card>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
