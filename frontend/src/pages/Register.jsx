import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import bgImage from "@/assets/background.png";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const data = await register(password);
      navigate("/dashboard", { state: { newUser: true, username: data.username } });
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength =
    password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ["", "Too short", "Good", "Strong! 💪"][strength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-teal-500"][strength];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Glass card */}
      <div className="glass rounded-3xl shadow-2xl w-full max-w-sm px-8 py-10">
        {/* Logo */}
        <Link to="/" className="flex justify-center mb-6">
          <img
            src={logo}
            alt="GoForDeutsch"
            className="h-36 w-auto object-contain drop-shadow-sm hover:scale-105 transition-transform duration-200"
          />
        </Link>

        <h1 className="text-center text-2xl font-extrabold text-foreground mb-1">
          Lass uns loslegen! 🎉
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-5">
          Choose a password — we&apos;ll give you a cool German username!
        </p>

        {/* Username hint pill */}
        <div className="mb-5 rounded-2xl bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 px-4 py-3 text-sm">
          <p className="font-bold text-teal-700 mb-0.5">🎲 Auto-generated username</p>
          <p className="text-teal-600/80 text-xs">
            e.g.&nbsp;<span className="font-semibold">KatzeSpringt</span> ·{" "}
            <span className="font-semibold">ApfelRollt</span> ·{" "}
            <span className="font-semibold">BrotFliegt</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-semibold text-foreground">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                autoFocus
                className="pr-10 bg-white/80 border-white/60 focus-visible:ring-teal-400"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-1 pt-0.5">
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        strength >= s ? strengthColor : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-muted-foreground">{strengthLabel}</p>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="font-semibold text-foreground">
              Confirm Password
            </Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="bg-white/80 border-white/60 focus-visible:ring-teal-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="gradient-btn w-full mt-2 h-11 rounded-xl text-white font-bold text-sm shadow-lg shadow-teal-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Creating your account…" : "Generate my Account ✨"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-teal-600 hover:text-teal-700 hover:underline"
          >
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
