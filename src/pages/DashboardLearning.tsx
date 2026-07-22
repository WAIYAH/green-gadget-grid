import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, Flame, Trophy, CheckCircle2, Circle, PlayCircle, Loader2, Award, Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Article = Pick<Database["public"]["Tables"]["articles"]["Row"], "id" | "title" | "description" | "category" | "thumbnail" | "quiz_questions" | "quiz_points" | "type">;
type Progress = Pick<Database["public"]["Tables"]["learning_progress"]["Row"], "article_id" | "status" | "quiz_passed" | "quiz_score" | "points_awarded">;
type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "current_streak" | "longest_streak">;

const DashboardLearning = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [progress, setProgress] = useState<Record<string, Progress>>({});
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: articleRows }, { data: progressRows }, { data: profileRow }] = await Promise.all([
      supabase.from("articles").select("id, title, description, category, thumbnail, quiz_questions, quiz_points, type").eq("published", true).order("created_at", { ascending: false }),
      supabase.from("learning_progress").select("article_id, status, quiz_passed, quiz_score, points_awarded").eq("user_id", user.id),
      supabase.from("profiles").select("current_streak, longest_streak").eq("id", user.id).maybeSingle(),
    ]);
    setArticles(articleRows || []);
    const map: Record<string, Progress> = {};
    (progressRows || []).forEach((p) => { map[p.article_id] = p; });
    setProgress(map);
    setProfile(profileRow);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const quizzable = useMemo(
    () => articles.filter((a) => Array.isArray(a.quiz_questions) && a.quiz_questions.length > 0),
    [articles]
  );
  const readOnly = useMemo(
    () => articles.filter((a) => !Array.isArray(a.quiz_questions) || a.quiz_questions.length === 0),
    [articles]
  );

  const completedCount = quizzable.filter((a) => progress[a.id]?.quiz_passed).length;
  const pointsEarned = Object.values(progress).reduce((s, p) => s + (p.points_awarded || 0), 0);
  const overallPct = quizzable.length ? Math.round((completedCount / quizzable.length) * 100) : 0;

  const statusFor = (articleId: string) => {
    const p = progress[articleId];
    if (p?.quiz_passed) return "completed";
    if (p) return "in_progress";
    return "not_started";
  };

  if (loading) {
    return (
      <DashboardLayout title="Learning Center">
        <div className="p-16 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading learning center…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Learning Center">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" /> Learning Center</h1>
        <p className="text-sm text-muted-foreground">Read the material, pass the quiz, earn points — and keep your streak alive.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 glass-lg border-border/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{profile?.current_streak ?? 0} <span className="text-sm font-normal text-muted-foreground">day{(profile?.current_streak ?? 0) === 1 ? "" : "s"}</span></p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Current Streak</p>
          </div>
        </Card>
        <Card className="p-5 glass-lg border-border/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{profile?.longest_streak ?? 0} <span className="text-sm font-normal text-muted-foreground">days</span></p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Longest Streak</p>
          </div>
        </Card>
        <Card className="p-5 glass-lg border-border/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{pointsEarned.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">pts</span></p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Earned from Learning</p>
          </div>
        </Card>
      </div>

      {quizzable.length > 0 && (
        <Card className="p-5 glass-lg border-border/30 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-foreground">Your Progress</h2>
            <span className="text-sm text-muted-foreground">{completedCount}/{quizzable.length} modules completed</span>
          </div>
          <Progress value={overallPct} className="h-2" />
        </Card>
      )}

      {quizzable.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-3">Modules with a Quiz</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {quizzable.map((a) => {
              const status = statusFor(a.id);
              const score = progress[a.id]?.quiz_score;
              return (
                <Card key={a.id} className="p-4 glass-hover flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                    {status === "completed" ? (
                      <Badge className="bg-primary/15 text-primary border-0 gap-1 text-[10px]"><CheckCircle2 className="w-3 h-3" /> Completed</Badge>
                    ) : status === "in_progress" ? (
                      <Badge className="bg-yellow-500/15 text-yellow-600 border-0 gap-1 text-[10px]"><PlayCircle className="w-3 h-3" /> In Progress</Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground"><Circle className="w-3 h-3" /> Not Started</Badge>
                    )}
                  </div>
                  <h3 className="font-bold text-foreground mb-1 line-clamp-2">{a.title}</h3>
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">{a.description}</p>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="flex items-center gap-1 text-accent font-medium"><Sparkles className="w-3.5 h-3.5" /> +{a.quiz_points} pts</span>
                    {typeof score === "number" && <span className="text-muted-foreground">Best score: {score}%</span>}
                  </div>
                  <Button size="sm" className="w-full bg-gradient-primary text-primary-foreground" onClick={() => navigate(`/dashboard/learning/${a.id}`)}>
                    {status === "completed" ? "Review" : status === "in_progress" ? "Continue" : "Start Learning"}
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {readOnly.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-3">More to Read</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {readOnly.map((a) => (
              <Card key={a.id} className="p-4 glass-hover flex flex-col">
                <Badge variant="outline" className="text-[10px] w-fit mb-2">{a.category}</Badge>
                <h3 className="font-bold text-foreground mb-1 line-clamp-2">{a.title}</h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">{a.description}</p>
                <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/dashboard/learning/${a.id}`)}>
                  Read
                </Button>
              </Card>
            ))}
          </div>
        </>
      )}

      {articles.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No learning content published yet.</p>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DashboardLearning;
