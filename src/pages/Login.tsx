import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Leaf } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields");
    setLoading(true);
    const { error, role } = await signIn(email, password);
    setLoading(false);
    if (error) return toast.error(error.message);

    const isAdmin = role === "admin";
    toast.success(isAdmin ? "Welcome back, Admin!" : "Welcome back!");
    navigate(isAdmin ? "/admin" : "/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>
      <Card className="w-full max-w-md p-8 shadow-primary animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 hover:opacity-90 transition-opacity">
            <Leaf className="w-10 h-10 text-white" />
          </Link>
          <h1 className="text-3xl font-bold text-gradient-primary">Triple G — Secure Login Portal</h1>
          <p className="text-muted-foreground mt-2">Welcome back!</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary hover:opacity-90">
            {loading ? "Signing in…" : "Login"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Register here</Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
