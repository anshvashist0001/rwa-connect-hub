import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authApi } from "@/lib/api";
import { Eye, EyeOff, Lock } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Ensure navigating to this page logs the user out securely
  useEffect(() => {
    localStorage.removeItem("rwa_admin_token");
    localStorage.removeItem("rwa_admin");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Demo access must be explicitly enabled for local previews.
    try {
      const { token, admin } = await authApi.login(form.username, form.password);
      localStorage.setItem("rwa_admin_token", token);
      localStorage.setItem("rwa_admin", JSON.stringify(admin));
      navigate("/admin/dashboard");
      return;
    } catch {
      // Backend unavailable — use demo credentials
    }

    if (import.meta.env.VITE_DEMO_MODE === "true" && form.username === "admin" && form.password === "admin123") {
      localStorage.setItem("rwa_admin_token", "demo-token");
      localStorage.setItem("rwa_admin", JSON.stringify({ id: 1, username: "admin", name: "RWA Administrator", role: "superadmin" }));
      navigate("/admin/dashboard");
    } else {
      setError("Sign-in failed. Check your credentials and that the API is running.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold">
            RWA <span className="text-accent">Shyam Kunj</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">Admin Panel — Secure Login</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 mx-auto mb-6">
            <Lock className="w-5 h-5 text-accent" />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 mb-4 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Username</label>
              <input
                type="text"
                required
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" variant="accent" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          For residents, visit the{" "}
          <a href="/" className="text-accent hover:underline">main website</a>.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
