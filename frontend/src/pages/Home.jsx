import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Sparkles, Upload, ArrowRight } from "lucide-react";
import logo from "@/assets/logo.png";
import bgImage from "@/assets/background.png";

const features = [
  {
    emoji: "📄",
    title: "Upload Your Materials",
    desc: "Drop in your PDFs, notes, or any German text — we'll do the rest!",
    gradient: "from-teal-400 to-cyan-500",
    bg: "bg-teal-50 border-teal-100",
  },
  {
    emoji: "🧠",
    title: "AI Mind Maps",
    desc: "Watch your content transform into beautiful, visual mind maps instantly.",
    gradient: "from-violet-400 to-indigo-500",
    bg: "bg-violet-50 border-violet-100",
  },
  {
    emoji: "⚡",
    title: "Personalized Quizzes",
    desc: "Practice smarter with quizzes made from your own study material.",
    gradient: "from-amber-400 to-orange-500",
    bg: "bg-amber-50 border-amber-100",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero with background image ── */}
      <div
        className="relative"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Sticky navbar */}
        <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/50 shadow-sm">
          <div className="mx-auto max-w-6xl px-6 py-3 flex items-center justify-between">
            <Link to="/">
              <img src={logo} alt="GoForDeutsch" className="h-10 w-auto object-contain" />
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild className="font-semibold">
                <Link to="/login">Sign In</Link>
              </Button>
              <Link to="/register">
                <button className="gradient-btn px-5 py-2 rounded-xl text-white font-bold text-sm shadow-md shadow-teal-200">
                  Get Started 🚀
                </button>
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero content */}
        <div className="mx-auto max-w-6xl px-6 pt-24 pb-32 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-teal-200 px-5 py-2 text-sm font-semibold text-teal-700 mb-8 shadow-sm">
            <Sparkles className="h-4 w-4" />
            AI-Powered German Learning ✨
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6 drop-shadow-sm">
            <span className="text-foreground">Learn German,</span>
            <br />
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #0ea5a0, #0891b2)" }}
            >
              Your Way! 🇩🇪
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-lg text-gray-700 leading-relaxed mb-10 font-medium drop-shadow-sm">
            Upload your German study materials and let AI turn them into{" "}
            <strong className="text-teal-700">mind maps</strong> and{" "}
            <strong className="text-indigo-600">personalized quizzes</strong> — perfect for A1
            &amp; A2 learners! 🎓
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <button className="gradient-btn flex items-center gap-2 px-8 py-3.5 rounded-2xl text-white font-bold text-base shadow-xl shadow-teal-300">
                Start Learning Free
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
            <Button size="lg" variant="outline" asChild className="bg-white/80 font-semibold rounded-2xl">
              <Link to="/login">I already have an account</Link>
            </Button>
          </div>

          {/* Level badges */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {[
              { label: "🌱 A1 Beginner", color: "bg-green-100 border-green-200 text-green-700" },
              { label: "🌿 A2 Elementary", color: "bg-teal-100 border-teal-200 text-teal-700" },
              { label: "✨ No experience needed", color: "bg-violet-100 border-violet-200 text-violet-700" },
              { label: "🎉 Free to start", color: "bg-amber-100 border-amber-200 text-amber-700" },
            ].map(({ label, color }) => (
              <span
                key={label}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold shadow-sm ${color} bg-opacity-90`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-background" />
      </div>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-3">
            How it works 🤔
          </h2>
          <p className="text-muted-foreground text-lg">Three easy steps to smarter German</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ emoji, title, desc, gradient, bg }, i) => (
            <div
              key={title}
              className={`card-hover rounded-3xl border p-6 shadow-sm ${bg}`}
            >
              <div
                className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg text-2xl`}
              >
                {emoji}
              </div>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="mb-2 font-extrabold text-foreground text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div
          className="rounded-3xl px-8 py-14 text-center text-white shadow-xl"
          style={{ backgroundImage: "linear-gradient(135deg, #0ea5a0 0%, #0891b2 50%, #6366f1 100%)" }}
        >
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-3xl font-extrabold mb-3">Ready to master German?</h2>
          <p className="mb-8 opacity-90 text-base max-w-md mx-auto">
            Join hundreds of learners using AI to make German study smarter, faster, and way more fun! 🎯
          </p>
          <Link to="/register">
            <button className="bg-white text-teal-700 font-extrabold px-8 py-3.5 rounded-2xl text-base shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200">
              Create your free account 🚀
            </button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} GoForDeutsch · Made with ❤️ for A1–A2 German learners
      </footer>
    </div>
  );
}
