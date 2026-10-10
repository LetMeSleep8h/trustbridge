import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Shield, Mail, Lock, Eye, EyeOff, UserPlus, Github } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/AppContext";
import * as api from "@/services/api";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign Up — TrustBridge" }] }),
  component: SignupPage,
});

const AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Salem&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=d4e157",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe&backgroundColor=ffb3ba",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Max&backgroundColor=ffcc80",
];

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belarus", "Belgium", "Benin", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Chad", "Chile", "China", "Colombia",
  "Comoros", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominican Republic", "DR Congo",
  "Ecuador", "Egypt", "El Salvador", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Guinea", "Haiti", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Liberia",
  "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Mauritania", "Mauritius", "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Panama", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Somalia",
  "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan", "Vatican City", "Venezuela", "Vietnam",
  "Yemen", "Zambia", "Zimbabwe",
];

function SignupPage() {
  const nav = useNavigate();
  const { setUser } = useApp();
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
    avatar: "", gender: "", country: "", bio: "",
    facebook: "", instagram: "", youtube: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await api.register({ ...form });
      localStorage.setItem("trustbridge_token", res.token);
      setUser(res.user);
      nav({ to: "/dashboard" });
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center py-12">
      <div className="w-full max-w-2xl px-4">
        <div className="flex items-center justify-center mb-8">
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

        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-center mb-1">Create account</h1>
          <p className="text-sm text-muted-foreground text-center mb-6">Start your humanitarian journey</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">First Name *</label>
                <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} autoComplete="given-name" className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Last Name *</label>
                <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} autoComplete="family-name" className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm" required />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Email *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm" required />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min 8 chars" autoComplete="new-password" className="w-full h-11 pl-9 pr-10 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm" required minLength={8} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type={showConfirmPw ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repeat password" autoComplete="new-password" className="w-full h-11 pl-9 pr-10 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm" required />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Choose Avatar</label>
              <div className="flex gap-3 flex-wrap">
                {AVATARS.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm({ ...form, avatar: url })}
                    className={`w-14 h-14 rounded-full border-2 transition overflow-hidden ${
                      form.avatar === url ? "border-primary shadow-glow scale-110" : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img src={url} alt={`Avatar ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Gender + Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Gender</label>
                <div className="relative">
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full h-11 px-3 rounded-xl bg-[#1a1f35] border border-white/10 focus:border-primary outline-none text-sm text-white appearance-none cursor-pointer">
                    <option value="" className="bg-[#1a1f35] text-white/60">Prefer not to say</option>
                    <option value="male" className="bg-[#1a1f35] text-white">Male</option>
                    <option value="female" className="bg-[#1a1f35] text-white">Female</option>
                    <option value="other" className="bg-[#1a1f35] text-white">Other</option>
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">▼</div>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Country</label>
                <div className="relative">
                  <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full h-11 px-3 rounded-xl bg-[#1a1f35] border border-white/10 focus:border-primary outline-none text-sm text-white appearance-none cursor-pointer">
                    <option value="" className="bg-[#1a1f35] text-white/60">Select country</option>
                    {COUNTRIES.map((c) => <option key={c} value={c} className="bg-[#1a1f35] text-white">{c}</option>)}
                  </select>
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-xs">▼</div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bio (optional)</label>
              <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Tell us about yourself..." className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm resize-none" />
            </div>

            {/* Social Links */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Social Media (optional)</label>
              <div className="space-y-3">
                <input value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="https://facebook.com/username" className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm" />
                <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="https://instagram.com/username" className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm" />
                <input value={form.youtube} onChange={(e) => setForm({ ...form, youtube: e.target.value })} placeholder="https://youtube.com/@username" className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 focus:border-primary outline-none text-sm" />
              </div>
            </div>

            {error && <div className="text-xs text-red-500 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">{error}</div>}

            <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-gradient-brand text-primary-foreground font-medium inline-flex items-center justify-center gap-2 hover:shadow-glow transition disabled:opacity-60">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus className="w-4 h-4" />}
              {loading ? "Creating…" : "Create Account"}
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
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}