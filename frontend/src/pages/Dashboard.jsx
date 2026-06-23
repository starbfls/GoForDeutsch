import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Map,
  Settings,
  LogOut,
  Sparkles,
  BookOpen,
  ChevronRight,
  Trophy,
} from "lucide-react";
import logo from "@/assets/logo.png";

const navItems = [
  { icon: Upload, label: "Upload Material", emoji: "📄", href: "#upload", soon: false },
  { icon: Map, label: "My Mind Maps", emoji: "🧠", href: "#mindmaps", soon: true },
  { icon: BookOpen, label: "Quizzes", emoji: "⚡", href: "#quizzes", soon: true },
  { icon: Settings, label: "Settings", emoji: "⚙️", href: "#settings", soon: true },
];

const featureCards = [
  {
    emoji: "📄",
    title: "Upload a Document",
    desc: "Start by uploading a PDF or text file with German content.",
    gradient: "from-teal-400 to-cyan-500",
    shadow: "shadow-teal-200",
    action: "Upload now",
    soon: false,
  },
  {
    emoji: "🧠",
    title: "Mind Map Generator",
    desc: "AI will turn your materials into visual, beautiful mind maps.",
    gradient: "from-violet-400 to-indigo-500",
    shadow: "shadow-violet-200",
    action: "Coming soon",
    soon: true,
  },
  {
    emoji: "🏆",
    title: "Personalized Quizzes",
    desc: "Practice German with quizzes made from your own content.",
    gradient: "from-amber-400 to-orange-500",
    shadow: "shadow-amber-200",
    action: "Coming soon",
    soon: true,
  },
];

export default function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isNewUser = location.state?.newUser;

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "hsl(210 30% 96%)" }}>

      {/* ── Sidebar ── */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-16"
        } hidden md:flex flex-col transition-all duration-300 shrink-0`}
        style={{
          background: "linear-gradient(160deg, #0d9488 0%, #0891b2 60%, #6366f1 100%)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center justify-center h-16 border-b border-white/20 px-3 overflow-hidden">
          <Link to="/">
            {sidebarOpen ? (
              <img src={logo} alt="GoForDeutsch" className="h-10 w-auto object-contain brightness-0 invert" />
            ) : (
              <img src={logo} alt="GoForDeutsch" className="h-8 w-8 object-cover object-left brightness-0 invert" />
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 pt-4">
          {navItems.map(({ icon: Icon, label, emoji, href, soon }) => (
            <a
              key={label}
              href={href}
              onClick={(e) => soon && e.preventDefault()}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                soon
                  ? "text-white/40 cursor-default"
                  : "text-white/90 hover:bg-white/20 hover:text-white"
              }`}
            >
              <span className="text-base shrink-0">{emoji}</span>
              {sidebarOpen && (
                <span className="flex-1 flex items-center gap-2">
                  {label}
                  {soon && (
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold tracking-wide">
                      SOON
                    </span>
                  )}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/20">
          {sidebarOpen && (
            <div className="mb-2 rounded-xl bg-white/15 px-3 py-2.5">
              <p className="text-xs text-white/60 font-medium">Signed in as</p>
              <p className="text-sm font-bold text-white truncate">{user.username}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 hover:bg-red-500/30 hover:text-white transition-all ${
              !sidebarOpen ? "justify-center" : ""
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0 shadow-sm">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="hidden md:flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ChevronRight
              className={`h-5 w-5 transition-transform duration-300 ${sidebarOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Mobile logo */}
          <Link to="/" className="flex md:hidden">
            <img src={logo} alt="GoForDeutsch" className="h-9 w-auto object-contain" />
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hallo,{" "}
              <strong className="text-foreground font-bold">{user.username}</strong>! 👋
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-6 md:p-8 overflow-auto">

          {/* Welcome banner (new users) */}
          {isNewUser && (
            <div className="mb-6 rounded-2xl px-5 py-4 flex items-start gap-3 shadow-md"
              style={{ background: "linear-gradient(135deg, #ccfbf1, #cffafe)" }}
            >
              <span className="text-2xl shrink-0">🎊</span>
              <div>
                <p className="font-extrabold text-teal-800 text-base">
                  Willkommen, {user.username}!
                </p>
                <p className="text-sm text-teal-700 mt-0.5">
                  Your unique German username has been generated! Save it somewhere — you&apos;ll
                  use it to log in next time.
                </p>
              </div>
            </div>
          )}

          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground">
              Hallo, {user.username}! 🌟
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              Ready to continue your German journey? Here&apos;s what you can explore:
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {featureCards.map(({ emoji, title, desc, gradient, shadow, action, soon }) => (
              <div
                key={title}
                className={`card-hover rounded-3xl bg-white p-6 shadow-lg ${shadow} border border-gray-100 ${
                  soon ? "opacity-75" : ""
                }`}
              >
                <div
                  className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-md text-2xl`}
                >
                  {emoji}
                </div>
                <h3 className="font-extrabold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">{desc}</p>
                <button
                  disabled={soon}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    soon
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "gradient-btn text-white shadow-md shadow-teal-200"
                  }`}
                >
                  {action}
                </button>
              </div>
            ))}
          </div>

          {/* Progress placeholder */}
          <div className="rounded-3xl bg-white border border-gray-100 p-6 shadow-sm">
            <h2 className="font-extrabold text-foreground mb-4 flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-teal-500" />
              Your Learning Progress
            </h2>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div
                className="h-20 w-20 rounded-3xl flex items-center justify-center mb-4 text-4xl shadow-inner"
                style={{ background: "linear-gradient(135deg, #f0fdf4, #ccfbf1)" }}
              >
                🗺️
              </div>
              <p className="font-extrabold text-foreground mb-1">No activity yet</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Upload your first German document to start building your personalized learning
                path. It only takes a few seconds! ⚡
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
