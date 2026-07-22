import { useCallback, useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Star, Trash2, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

const fadeIn = (i: number) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.05 } });

type Feedback = Database["public"]["Tables"]["feedback"]["Row"];
type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email">;

const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`h-3 w-3 ${s <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}`} />
    ))}
  </div>
);

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Feedback | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("feedback").select("*").order("created_at", { ascending: false });
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = data || [];
    setFeedback(rows);
    const userIds = Array.from(new Set(rows.map((f) => f.user_id).filter((id): id is string => !!id)));
    if (userIds.length) {
      const { data: profileRows } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
      const map: Record<string, Profile> = {};
      (profileRows || []).forEach((p) => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const total = feedback.length;
    const avgRating = total ? (feedback.reduce((s, f) => s + f.rating, 0) / total).toFixed(1) : "0.0";
    const categories = new Set(feedback.map((f) => f.category).filter(Boolean)).size;
    const lowRated = feedback.filter((f) => f.rating <= 2).length;
    return [
      { label: "Total Feedback", value: String(total) },
      { label: "Avg Rating", value: `${avgRating}/5` },
      { label: "Categories", value: String(categories) },
      { label: "Low Rated (≤2)", value: String(lowRated) },
    ];
  }, [feedback]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("feedback").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success("Feedback deleted");
    setDeleteTarget(null);
    load();
  };

  const renderList = (list: Feedback[]) => (
    <>
      {list.map((f, i) => {
        const submitter = f.user_id ? profiles[f.user_id] : null;
        return (
          <motion.div key={f.id} {...fadeIn(i)}>
            <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{submitter?.full_name || submitter?.email || "Anonymous"}</span>
                    {f.category && <Badge variant="outline" className="text-xs">{f.category}</Badge>}
                  </div>
                  <RatingStars rating={f.rating} />
                  <p className="text-sm text-muted-foreground mt-2">{f.comment}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(f.created_at).toLocaleString()}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(f)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          </motion.div>
        );
      })}
      {list.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No feedback found.</div>
      )}
    </>
  );

  return (
    <AdminLayout title="Feedback" breadcrumbs={[{ label: "Support" }, { label: "Feedback" }]}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Feedback</h1>
          <p className="text-sm text-muted-foreground">Review user feedback and ratings</p>
        </div>
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

      {loading ? (
        <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading feedback…
        </div>
      ) : (
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="low">Low Rated</TabsTrigger>
          <TabsTrigger value="high">High Rated</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">{renderList(feedback)}</TabsContent>
        <TabsContent value="low" className="space-y-3">{renderList(feedback.filter((f) => f.rating <= 2))}</TabsContent>
        <TabsContent value="high" className="space-y-3">{renderList(feedback.filter((f) => f.rating >= 4))}</TabsContent>
      </Tabs>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this feedback?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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

export default AdminFeedback;
