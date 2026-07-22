import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Leaf, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPasswordForEmail } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Enter your email address");
    setLoading(true);
    const { error } = await resetPasswordForEmail(email);
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Link
        to="/login"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to login
      </Link>
      <Card className="w-full max-w-md p-8 shadow-primary animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 hover:opacity-90 transition-opacity">
            <Leaf className="w-10 h-10 text-white" />
          </Link>
          <h1 className="text-3xl font-bold text-gradient-primary">Reset your password</h1>
          <p className="text-muted-foreground mt-2 text-center">
            {sent ? "Check your inbox for a reset link." : "We'll email you a link to reset it."}
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <MailCheck className="w-10 h-10 text-primary" />
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="text-foreground font-medium">{email}</span>, a password
              reset link is on its way.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90">
              {loading ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Remembered it? <Link to="/login" className="text-primary hover:underline font-medium">Login here</Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
