import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Award } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SubmitGadget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    category: "",
    condition: "",
    description: "",
  });
  const [estimatedPoints, setEstimatedPoints] = useState(0);

  const calculatePoints = (condition: string, category: string) => {
    const baseValues: Record<string, number> = {
      smartphone: 100, laptop: 200, tablet: 150, smartwatch: 80, headphones: 50,
    };
    const conditionMultipliers: Record<string, number> = {
      excellent: 1.0, good: 0.75, fair: 0.5, poor: 0.25,
    };
    return Math.round((baseValues[category] || 100) * (conditionMultipliers[condition] || 0.5) * 10);
  };

  const handleInputChange = (field: string, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    if (next.condition && next.category) setEstimatedPoints(calculatePoints(next.condition, next.category));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Please log in first"); return navigate("/login"); }
    if (!formData.name || !formData.brand || !formData.category || !formData.condition) {
      return toast.error("Please fill in all required fields");
    }
    setSaving(true);
    const { error } = await supabase.from("gadgets").insert({
      user_id: user.id,
      name: formData.name,
      brand: formData.brand,
      category: formData.category,
      condition: formData.condition,
      description: formData.description,
      points_value: estimatedPoints,
      cash_value: estimatedPoints * 0.1,
      status: "pending",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`Gadget submitted! Estimated reward: ${estimatedPoints} points`);
    navigate("/dashboard/listings");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-bold mb-2">Submit Gadget</h1>
            <p className="text-muted-foreground">Tell us about your device and we'll calculate your reward</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-8 shadow-card">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Device Name *</Label>
                  <Input id="name" placeholder="e.g., iPhone 12" value={formData.name} onChange={(e) => handleInputChange("name", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand *</Label>
                  <Input id="brand" placeholder="e.g., Apple" value={formData.brand} onChange={(e) => handleInputChange("brand", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select onValueChange={(v) => handleInputChange("category", v)}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smartphone">Smartphone</SelectItem>
                      <SelectItem value="laptop">Laptop</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="smartwatch">Smartwatch</SelectItem>
                      <SelectItem value="headphones">Headphones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Condition *</Label>
                  <Select onValueChange={(v) => handleInputChange("condition", v)}>
                    <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Additional Notes</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Upload Images</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                  </div>
                </div>
                <Button type="submit" disabled={saving} className="w-full bg-gradient-primary hover:opacity-90" size="lg">
                  {saving ? "Submitting…" : "Submit for Evaluation"}
                </Button>
              </form>
            </Card>

            <div className="space-y-6">
              <Card className="p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Reward</p>
                    <p className="text-2xl font-bold text-primary">{estimatedPoints} pts</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>≈ ${(estimatedPoints * 0.1).toFixed(2)} cash value</p>
                  <p>≈ {(estimatedPoints * 0.05).toFixed(1)} kg CO₂ credits</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubmitGadget;
