import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Key, Globe, Palette, Trash2, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";

const DashboardSettings = () => {
  const [twoFA, setTwoFA] = useState(false);
  const [marketing, setMarketing] = useState(true);
  const [language, setLanguage] = useState("en");
  const [theme, setTheme] = useState("dark");

  return (
    <DashboardLayout title="Settings">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account security, preferences, and data.</p>
      </div>

      <div className="space-y-5 max-w-4xl">
        {/* Password */}
        <Card className="p-6 glass-lg border-border/30">
          <h2 className="font-semibold flex items-center gap-2 mb-1"><Key className="w-4 h-4 text-primary" /> Password</h2>
          <p className="text-xs text-muted-foreground mb-4">Update your account password regularly.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Current Password</Label><Input type="password" className="mt-1.5 bg-background/50" /></div>
            <div></div>
            <div><Label>New Password</Label><Input type="password" className="mt-1.5 bg-background/50" /></div>
            <div><Label>Confirm Password</Label><Input type="password" className="mt-1.5 bg-background/50" /></div>
          </div>
          <Button onClick={() => toast.success("Password updated")} className="mt-4 bg-gradient-primary text-primary-foreground">
            <Save className="w-4 h-4 mr-2" /> Update Password
          </Button>
        </Card>

        {/* Security */}
        <Card className="p-6 glass-lg border-border/30">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><Shield className="w-4 h-4 text-primary" /> Security</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
              </div>
              <div className="flex items-center gap-3">
                {twoFA && <Badge className="bg-primary/15 text-primary border-primary/30">Enabled</Badge>}
                <Switch checked={twoFA} onCheckedChange={setTwoFA} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/10">
              <div>
                <p className="font-medium">Login Alerts</p>
                <p className="text-xs text-muted-foreground">Get notified on new device sign-ins.</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-6 glass-lg border-border/30">
          <h2 className="font-semibold flex items-center gap-2 mb-4"><Palette className="w-4 h-4 text-primary" /> Preferences</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1.5 bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="mt-1.5 bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border/10">
            <div>
              <p className="font-medium">Marketing Emails</p>
              <p className="text-xs text-muted-foreground">Receive product news and offers.</p>
            </div>
            <Switch checked={marketing} onCheckedChange={setMarketing} />
          </div>
        </Card>

        {/* Danger zone */}
        <Card className="p-6 glass-lg border border-destructive/30">
          <h2 className="font-semibold flex items-center gap-2 mb-1 text-destructive">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h2>
          <p className="text-xs text-muted-foreground mb-4">Irreversible actions. Proceed with caution.</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div>
              <p className="font-medium text-foreground">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently remove your account and all data.</p>
            </div>
            <Button variant="destructive" onClick={() => toast.error("Account deletion requested")}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSettings;
