import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface ContentItem {
  id: string;
  type: "article" | "video" | "infographic";
  title: string;
  category: string;
  description: string;
  content?: string;
  author: string;
  date: string;
  thumbnail: string;
  videoUrl?: string;
  views: number;
  featured?: boolean;
  quizQuestions?: QuizQuestion[];
  quizPoints?: number;
}

interface AwarenessContextType {
  content: ContentItem[];
  loading: boolean;
  addContent: (item: Omit<ContentItem, "id" | "views">) => Promise<void>;
  updateContent: (id: string, item: Partial<ContentItem>) => Promise<void>;
  deleteContent: (id: string) => Promise<void>;
  incrementViews: (id: string) => void;
}

const AwarenessContext = createContext<AwarenessContextType | undefined>(undefined);

type ArticleRow = {
  id: string;
  type: string;
  title: string;
  category: string;
  description: string | null;
  content: string | null;
  author: string | null;
  thumbnail: string | null;
  video_url: string | null;
  views: number;
  featured: boolean;
  created_at: string;
  quiz_questions: unknown;
  quiz_points: number;
};

const fromRow = (row: ArticleRow): ContentItem => ({
  id: row.id,
  type: (row.type as ContentItem["type"]) || "article",
  title: row.title,
  category: row.category,
  description: row.description || "",
  content: row.content || undefined,
  author: row.author || "",
  date: row.created_at.split("T")[0],
  thumbnail: row.thumbnail || "/placeholder.svg",
  videoUrl: row.video_url || undefined,
  views: row.views,
  featured: row.featured,
  quizQuestions: Array.isArray(row.quiz_questions) ? (row.quiz_questions as QuizQuestion[]) : undefined,
  quizPoints: row.quiz_points,
});

export const AwarenessProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("articles")
      .select("id, type, title, category, description, content, author, thumbnail, video_url, views, featured, created_at, quiz_questions, quiz_points")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    setContent((data || []).map(fromRow));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const addContent = async (item: Omit<ContentItem, "id" | "views">) => {
    const { error } = await supabase.from("articles").insert({
      type: item.type,
      title: item.title,
      category: item.category,
      description: item.description,
      content: item.content,
      author: item.author,
      thumbnail: item.thumbnail,
      video_url: item.videoUrl,
      featured: item.featured || false,
      published: true,
      created_by: user?.id,
      quiz_questions: item.quizQuestions && item.quizQuestions.length > 0 ? item.quizQuestions : null,
      quiz_points: item.quizPoints ?? 20,
    });
    if (error) { toast.error(error.message); return; }
    await load();
  };

  const updateContent = async (id: string, updates: Partial<ContentItem>) => {
    const { error } = await supabase.from("articles").update({
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.category !== undefined && { category: updates.category }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.content !== undefined && { content: updates.content }),
      ...(updates.author !== undefined && { author: updates.author }),
      ...(updates.thumbnail !== undefined && { thumbnail: updates.thumbnail }),
      ...(updates.videoUrl !== undefined && { video_url: updates.videoUrl }),
      ...(updates.featured !== undefined && { featured: updates.featured }),
      ...(updates.quizQuestions !== undefined && { quiz_questions: updates.quizQuestions.length > 0 ? updates.quizQuestions : null }),
      ...(updates.quizPoints !== undefined && { quiz_points: updates.quizPoints }),
    }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await load();
  };

  const deleteContent = async (id: string) => {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setContent((prev) => prev.filter((item) => item.id !== id));
  };

  const incrementViews = (id: string) => {
    setContent((prev) => prev.map((item) => (item.id === id ? { ...item, views: item.views + 1 } : item)));
    supabase.rpc("increment_article_views", { _article_id: id }).then(({ error }) => {
      if (error) console.error("Failed to persist article view:", error.message);
    });
  };

  return (
    <AwarenessContext.Provider value={{ content, loading, addContent, updateContent, deleteContent, incrementViews }}>
      {children}
    </AwarenessContext.Provider>
  );
};

export const useAwareness = () => {
  const context = useContext(AwarenessContext);
  if (!context) {
    throw new Error("useAwareness must be used within AwarenessProvider");
  }
  return context;
};
