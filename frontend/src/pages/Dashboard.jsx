import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Upload,
  Map,
  Settings,
  LogOut,
  Sparkles,
  BookOpen,
  ChevronRight,
  Trophy,
} from "lucide-react";

const navItems = [
  { icon: Upload, label: "Upload Material", href: "#upload", soon: false },
  { icon: Map, label: "My Mind Maps", href: "#mindmaps", soon: true },
  { icon: BookOpen, label: "Quizzes", href: "#quizzes", soon: true },
  { icon: Settings, label: "Settings", href: "#settings", soon: true },
];

const placeholderCards = [
  {
    icon: Upload,
    title: "Upload a Document",
    desc: "Start by uploading a PDF or text file with German content.",
    color: "bg-teal-50 text-teal-600 border-teal-100",
    action: "Upload now",
    soon: false,
  },
  {
    icon: Map,
    title: "Mind Map Generator",
    desc: "AI will turn your materials into visual mind maps.",
    color: "bg-indigo-50 text-indigo-600 border-indigo-100",
    action: "Coming soon",
    soon: true,
  },
  {
    icon: Trophy,
    title: "Personalized Quizzes",
    desc: "Practice German with quizzes made from your own content.",
    color: "bg-amber-50 text-amber-600 border-amber-100",
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-60" : "w-16"
        } hidden md:flex flex-col border-r bg-card transition-all duration-200 shrink-0`}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 p-4 border-b h-16">
          <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Globe className="h-4 w-4 text-white" />
          </div>
          {sidebarOpen && (
            <span className="font-bold text-foreground text-sm">GoForDeutsch</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ icon: Icon, label, href, soon }) => (
            <a
              key={label}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                soon
                  ? "text-muted-foreground hover:bg-muted cursor-default"
                  : "text-foreground hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={(e) => soon && e.preventDefault()}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && (
                <span className="flex-1">
                  {label}
                  {soon && (
                    <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      soon
                    </span>
                  )}
                </span>
              )}
            </a>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-3 border-t">
          {sidebarOpen && (
            <div className="mb-2 rounded-xl bg-muted/60 px-3 py-2.5">
              <p className="text-xs text-muted-foreground">Signed in as</p>
              <p className="text-sm font-semibold text-foreground truncate">{user.username}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size={sidebarOpen ? "sm" : "icon"}
            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-6 shrink-0">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className={`h-5 w-5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Mobile logo */}
          <Link to="/" className="flex md:hidden items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary flex items-center justify-center">
              <Globe className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">GoForDeutsch</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Hallo, <strong className="text-foreground">{user.username}</strong>!
            </span>
            <Button size="sm" variant="outline" onClick={handleLogout} className="gap-1.5">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-6 md:p-8">
          {/* Welcome banner */}
          {isNewUser && (
            <div className="mb-6 rounded-2xl bg-primary/10 border border-primary/20 px-5 py-4 flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">
                  Willkommen, {user.username}!
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Your unique German username has been generated. Save it — you&apos;ll need it to log in next time.
                </p>
              </div>
            </div>
          )}

          {/* Greeting */}
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Hallo, {user.username}!
            </h1>
            <p className="text-muted-foreground mt-1">
              Ready to continue your German journey? Here&apos;s what you can do:
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {placeholderCards.map(({ icon: Icon, title, desc, color, action, soon }) => (
              <div
                key={title}
                className={`rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow ${
                  soon ? "opacity-70" : ""
                }`}
              >
                <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5 text-sm">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">{desc}</p>
                <Button
                  size="sm"
                  variant={soon ? "secondary" : "default"}
                  disabled={soon}
                  className="text-xs"
                >
                  {action}
                </Button>
              </div>
            ))}
          </div>

          {/* Progress placeholder */}
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Your Learning Progress
            </h2>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Map className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground text-sm mb-1">No activity yet</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Upload your first German document to start building your personalized learning path.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
