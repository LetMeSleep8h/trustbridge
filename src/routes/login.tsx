import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Shield, Mail, Lock, Eye, EyeOff, Github } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/AppContext";
import * as api from "@/services/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign In — TrustBridge" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { setUser } = useApp();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.login({ email: form.email, password: form.password });
      localStorage.setItem("trustbridge_token", res.token);
      setUser(res.user);
      nav({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left panel - branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0a0e1a] via-[#0f1525] to-[#1a1f35] relative overflow-hidden">
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-brand grid place-items-center shadow-glow">
              <Shield className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display text-xl font-bold text-white">TrustBridge</div>
              <div className="text-[10px] uppercase tracking-widest text-white/50">On Stellar</div>
            </div>
          </Link>
        </div>
        <div className="relative z-10 space-y-6">
          <blockquote className="text-2xl font-display font-semibold text-white leading-snug max-w-md">
            "The best way to find yourself is to lose yourself in the service of others."
          </blockquote>
          <div className="text-white/60 text-sm">— Mahatma Gandhi</div>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald shadow-glow" /> Stellar Mainnet</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald shadow-glow" /> 4.2s Settlement</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald shadow-glow" /> 99.97% On-chain</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_oklch(0.68_0.16_235)_0%,_transparent_60%)]" />
      </div>

      {/* Right panel - form */}
      <div className="flex items-center justify-center p-8 bg-[#0a0e1a]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-display font-bold text-lg">TrustBridge</span>
            </Link>
          </div>

          <h1 className="font-display text-2xl font-bold text-center mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground text-center mb-8">Sign in to your TrustBridge account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm" required />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" className="w-full h-11 pl-9 pr-10 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm" required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <div className="text-xs text-red-500 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">{error}</div>}
            <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-brand text-primary-foreground font-medium inline-flex items-center justify-center gap-2 hover:shadow-glow transition disabled:opacity-60">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shield className="w-4 h-4" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0a0e1a] px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => api.startGithubLogin().catch(() => {})}
            className="mt-4 w-full h-11 rounded-xl border border-white/10 bg-white/5 text-sm font-medium inline-flex items-center justify-center gap-2 hover:bg-white/10 transition"
          >
            <Github className="w-4 h-4" />
            Sign in with GitHub
          </button>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}