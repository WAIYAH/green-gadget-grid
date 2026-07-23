import { useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Search, Edit, Trash2, Eye, Clock,
  Video, GraduationCap, Calendar, Tag, X,
} from "lucide-react";
import { useAwareness, ContentItem, QuizQuestion, AwarenessProvider } from "@/contexts/AwarenessContext";
import { toast } from "sonner";

const emptyQuestion = (): QuizQuestion => ({ question: "", options: ["", "", "", ""], correct: 0 });

const CATEGORIES = [
  "Sustainability 101", "Recycle Tips", "Tech & Environment",
  "Safe Disposal", "Reusing Components",
];

const AdminArticles = () => {
  const { content, loading, addContent, updateContent, deleteContent } = useAwareness();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", category: CATEGORIES[0], description: "", content: "",
    author: "", type: "article" as ContentItem["type"], thumbnail: "/placeholder.svg",
    quizQuestions: [] as QuizQuestion[], quizPoints: 20,
  });

  const filtered = content.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "all" || c.category === filterCat;
    return matchSearch && matchCat;
  });

  const stats = useMemo(() => [
    { label: "Total Content", value: String(content.length), icon: FileText, color: "text-primary" },
    { label: "Videos", value: String(content.filter((c) => c.type === "video").length), icon: Video, color: "text-primary" },
    { label: "Total Views", value: content.reduce((s, c) => s + c.views, 0).toLocaleString(), icon: Eye, color: "text-primary" },
    { label: "With Quiz", value: String(content.filter((c) => c.quizQuestions && c.quizQuestions.length > 0).length), icon: GraduationCap, color: "text-accent" },
  ], [content]);

  const openNew = () => {
    setEditing(null);
    setForm({
      title: "", category: CATEGORIES[0], description: "", content: "",
      author: "", type: "article", thumbnail: "/placeholder.svg",
      quizQuestions: [], quizPoints: 20,
    });
    setOpen(true);
  };

  const openEdit = (item: ContentItem) => {
    setEditing(item);
    setForm({
      title: item.title, category: item.category, description: item.description,
      content: item.content || "", author: item.author, type: item.type,
      thumbnail: item.thumbnail,
      quizQuestions: item.quizQuestions || [], quizPoints: item.quizPoints ?? 20,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title || !form.author) {
      toast.error("Title and author are required");
      return;
    }
    for (const q of form.quizQuestions) {
      if (!q.question.trim() || q.options.some((o) => !o.trim())) {
        toast.error("Every quiz question needs text and all four options filled in");
        return;
      }
    }
    setSaving(true);
    if (editing) {
      await updateContent(editing.id, form);
      toast.success("Article updated");
    } else {
      await addContent({ ...form, date: new Date().toISOString().split("T")[0] });
      toast.success("Article created");
    }
    setSaving(false);
    setOpen(false);
  };

  const addQuestion = () => setForm((p) => ({ ...p, quizQuestions: [...p.quizQuestions, emptyQuestion()] }));
  const removeQuestion = (i: number) => setForm((p) => ({ ...p, quizQuestions: p.quizQuestions.filter((_, idx) => idx !== i) }));
  const updateQuestion = (i: number, patch: Partial<QuizQuestion>) =>
    setForm((p) => ({ ...p, quizQuestions: p.quizQuestions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)) }));
  const updateOption = (qi: number, oi: number, value: string) =>
    setForm((p) => ({
      ...p,
      quizQuestions: p.quizQuestions.map((q, idx) => (idx === qi ? { ...q, options: q.options.map((o, oidx) => (oidx === oi ? value : o)) } : q)),
    }));

  const remove = async (id: string) => {
    await deleteContent(id);
    toast.success("Article deleted");
  };

  return (
    <AdminLayout title="Articles">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Articles & Content</h1>
          <p className="text-sm text-muted-foreground">Manage awareness articles, videos, and infographics</p>
        </div>
        <Button onClick={openNew} className="bg-gradient-primary text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> New Article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="p-5 glass-hover">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4 glass mb-4">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search articles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="glass">
        <Tabs defaultValue="all" className="p-4 lg:p-6">
          <TabsList className="bg-muted/30">
            <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="infographics">Infographics</TabsTrigger>
          </TabsList>

          {["all", "articles", "videos", "infographics"].map((tab) => {
            const items = tab === "all"
              ? filtered
              : filtered.filter((c) => c.type === tab.slice(0, -1));
            return (
              <TabsContent key={tab} value={tab} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {items.map((item, i) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Card className="p-4 glass-hover h-full flex flex-col">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <Badge variant="outline" className="text-[10px] uppercase">{item.type}</Badge>
                            <div className="flex gap-1">
                              {item.quizQuestions && item.quizQuestions.length > 0 && (
                                <Badge className="bg-primary/15 text-primary border-0 gap-1 text-[10px]"><GraduationCap className="w-3 h-3" />Quiz</Badge>
                              )}
                              {item.featured && (
                                <Badge className="bg-accent/20 text-accent border-0 text-[10px]">Featured</Badge>
                              )}
                            </div>
                          </div>
                          <h4 className="font-bold text-foreground mb-2 line-clamp-2">{item.title}</h4>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3 mt-auto">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{item.category}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{item.date}</span>
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.views.toLocaleString()}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEdit(item)}>
                              <Edit className="w-3 h-3" />Edit
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => remove(item.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading…</div>
                ) : items.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>No content found</p>
                  </div>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </Card>

      {/* Editor dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Article" : "New Article"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Type</label>
                <Select value={form.type} onValueChange={(v: ContentItem["type"]) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">Article</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="infographic">Infographic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Title</label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Author</label>
              <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Description</label>
              <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Content</label>
              <Textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>

            <div className="border-t border-border/50 pt-4">
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-primary" /> Learning Center Quiz (optional)</label>
                <Button type="button" size="sm" variant="outline" onClick={addQuestion} className="gap-1"><Plus className="w-3 h-3" /> Add Question</Button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Add questions to make this a quiz-gated module in the user Learning Center. Users need 70% to pass and earn points.
              </p>

              {form.quizQuestions.length > 0 && (
                <div className="mb-3">
                  <label className="text-xs text-muted-foreground mb-1 block">Points reward on pass</label>
                  <Input
                    type="number"
                    min={0}
                    className="w-32"
                    value={form.quizPoints}
                    onChange={(e) => setForm({ ...form, quizPoints: Number(e.target.value) || 0 })}
                  />
                </div>
              )}

              <div className="space-y-4">
                {form.quizQuestions.map((q, qi) => (
                  <Card key={qi} className="p-3 bg-muted/20 border-border/30">
                    <div className="flex items-start gap-2 mb-2">
                      <Input
                        placeholder={`Question ${qi + 1}`}
                        value={q.question}
                        onChange={(e) => updateQuestion(qi, { question: e.target.value })}
                        className="flex-1"
                      />
                      <Button type="button" size="icon" variant="ghost" className="shrink-0 text-destructive" onClick={() => removeQuestion(qi)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-1.5">Select the correct answer:</p>
                    <RadioGroup
                      value={q.correct.toString()}
                      onValueChange={(v) => updateQuestion(qi, { correct: Number(v) })}
                      className="space-y-1.5"
                    >
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <RadioGroupItem value={oi.toString()} id={`quiz-${qi}-${oi}`} />
                          <Input
                            placeholder={`Option ${oi + 1}`}
                            value={opt}
                            onChange={(e) => updateOption(qi, oi, e.target.value)}
                            className="flex-1 h-8 text-sm"
                          />
                        </div>
                      ))}
                    </RadioGroup>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} disabled={saving} className="bg-gradient-primary text-primary-foreground">
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default function AdminArticlesPage() {
  return (
    <AwarenessProvider>
      <AdminArticles />
    </AwarenessProvider>
  );
}

