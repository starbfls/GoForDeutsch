import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import bgImage from "@/assets/background.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

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
          Willkommen zurück! 👋
        </h1>
        <p className="text-center text-sm text-muted-foreground mb-7">
          Sign in with your German username
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="username" className="font-semibold text-foreground">
              Username
            </Label>
            <Input
              id="username"
              placeholder="e.g. KatzeSpringt"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              className="bg-white/80 border-white/60 focus-visible:ring-teal-400"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="font-semibold text-foreground">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="bg-white/80 border-white/60 focus-visible:ring-teal-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="gradient-btn w-full mt-2 h-11 rounded-xl text-white font-bold text-sm shadow-lg shadow-teal-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign In 🚀"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link
            to="/register"
            className="font-bold text-teal-600 hover:text-teal-700 hover:underline"
          >
            Create your account →
          </Link>
        </p>
      </div>
    </div>
  );
}
