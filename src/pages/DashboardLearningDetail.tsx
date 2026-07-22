import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Sparkles, CheckCircle2, XCircle, Loader2, PartyPopper, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Article = Database["public"]["Tables"]["articles"]["Row"];

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface QuizResult {
  score: number;
  passed: boolean;
  points_awarded: number;
}

const DashboardLearningDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const load = useCallback(async () => {
    if (!id || !user) return;
    setLoading(true);
    const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      toast.error("Article not found");
      navigate("/dashboard/learning");
      return;
    }
    setArticle(data);
    setLoading(false);

    // Marking a module in-progress is not a privileged action — RLS
    // ownership is enough. ON CONFLICT DO NOTHING so re-opening a
    // completed module never downgrades its status.
    await supabase.from("learning_progress").upsert(
      { user_id: user.id, article_id: id, status: "in_progress" },
      { onConflict: "user_id,article_id", ignoreDuplicates: true }
    );
    supabase.rpc("increment_article_views", { _article_id: id }).then(() => {});
  }, [id, user, navigate]);

  useEffect(() => { load(); }, [load]);

  const questions = useMemo<QuizQuestion[]>(() => {
    const q = article?.quiz_questions;
    return Array.isArray(q) ? (q as unknown as QuizQuestion[]) : [];
  }, [article]);

  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined);

  const handleSubmit = async () => {
    if (!id || !allAnswered) return;
    setSubmitting(true);
    const answerArray = questions.map((_, i) => answers[i]);
    const { data, error } = await supabase.rpc("submit_learning_quiz", { _article_id: id, _answers: answerArray }).single();
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setResult(data as QuizResult);
    if (data.points_awarded > 0) {
      toast.success(`Passed! +${data.points_awarded} points earned 🎉`);
      window.dispatchEvent(new Event("points:refresh"));
    } else if (data.passed) {
      toast.success("Passed — you'd already claimed the points for this one.");
    } else {
      toast.error(`Scored ${data.score}% — need 70% to pass. Try again!`);
    }
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
  };

  if (loading || !article) {
    return (
      <DashboardLayout title="Learning">
        <div className="p-16 text-center text-muted-foreground flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading…
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={article.title}>
      <Link to="/dashboard/learning" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Learning Center
      </Link>

      <Card className="p-6 glass-lg border-border/30 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-[10px]">{article.category}</Badge>
          {questions.length > 0 && (
            <Badge className="bg-accent/15 text-accent border-0 gap-1 text-[10px]"><Sparkles className="w-3 h-3" /> +{article.quiz_points} pts on completion</Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{article.title}</h1>
        <p className="text-sm text-muted-foreground mb-4">{article.description}</p>
        <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
          {article.content}
        </div>
      </Card>

      {questions.length > 0 && !showQuiz && !result && (
        <div className="flex justify-center">
          <Button size="lg" className="bg-gradient-primary text-primary-foreground" onClick={() => setShowQuiz(true)}>
            Take the Quiz
          </Button>
        </div>
      )}

      {questions.length > 0 && showQuiz && !result && (
        <Card className="p-6 glass-lg border-border/30 space-y-6">
          <h2 className="text-lg font-bold text-foreground">Quiz — {questions.length} question{questions.length === 1 ? "" : "s"}</h2>
          {questions.map((q, i) => (
            <div key={i} className="space-y-3">
              <p className="font-medium text-foreground">{i + 1}. {q.question}</p>
              <RadioGroup value={answers[i]?.toString()} onValueChange={(v) => setAnswers((p) => ({ ...p, [i]: Number(v) }))}>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                    <RadioGroupItem value={oi.toString()} id={`q${i}-o${oi}`} />
                    <Label htmlFor={`q${i}-o${oi}`} className="cursor-pointer flex-1 font-normal">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
          <Button onClick={handleSubmit} disabled={!allAnswered || submitting} className="w-full bg-gradient-primary text-primary-foreground">
            {submitting ? "Submitting…" : "Submit Quiz"}
          </Button>
        </Card>
      )}

      {result && (
        <Card className={`p-8 glass-lg border-border/30 text-center ${result.passed ? "border-primary/30" : "border-destructive/30"}`}>
          {result.passed ? (
            <PartyPopper className="w-12 h-12 mx-auto mb-3 text-primary" />
          ) : (
            <XCircle className="w-12 h-12 mx-auto mb-3 text-destructive" />
          )}
          <h2 className="text-xl font-bold text-foreground mb-1">
            {result.passed ? "You passed!" : "Not quite — try again"}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">Score: {result.score}% {result.passed ? "" : "(need 70% to pass)"}</p>
          {result.points_awarded > 0 && (
            <Badge className="bg-accent/15 text-accent border-0 gap-1 mb-4"><Sparkles className="w-3 h-3" /> +{result.points_awarded} points earned</Badge>
          )}
          <div className="flex gap-3 justify-center mt-4">
            {!result.passed && (
              <Button variant="outline" onClick={retry} className="gap-2">
                <RotateCcw className="w-4 h-4" /> Try Again
              </Button>
            )}
            <Button className="bg-gradient-primary text-primary-foreground" onClick={() => navigate("/dashboard/learning")}>
              Back to Learning Center
            </Button>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default DashboardLearningDetail;
