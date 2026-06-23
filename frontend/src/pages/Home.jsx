import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Brain, Sparkles, Upload, ArrowRight, Globe } from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload Your Materials",
    desc: "Import PDFs, notes, or any German text you're studying.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Brain,
    title: "AI Mind Maps",
    desc: "Our AI instantly transforms your content into visual mind maps.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Sparkles,
    title: "Personalized Quizzes",
    desc: "Practice with quizzes tailored to your own learning material.",
    color: "bg-amber-50 text-amber-600",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
              <Globe className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">GoForDeutsch</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered German Learning
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-tight tracking-tight mb-6">
          Learn German,{" "}
          <span className="text-primary">Your Way</span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed mb-10">
          Upload your German study materials and let AI turn them into beautiful mind maps
          and personalized quizzes — perfect for A1 &amp; A2 learners.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" asChild className="gap-2">
            <Link to="/register">
              Start Learning Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/login">I already have an account</Link>
          </Button>
        </div>

        {/* Floating badges */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {["A1 Beginner", "A2 Elementary", "No experience needed", "Free to start"].map(
            (tag) => (
              <span
                key={tag}
                className="rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-sm"
              >
                {tag}
              </span>
            )
          )}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-3">How it works</h2>
          <p className="text-muted-foreground">Three steps to smarter German learning</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-2xl bg-primary px-8 py-12 text-center text-white">
          <BookOpen className="mx-auto mb-4 h-10 w-10 opacity-90" />
          <h2 className="text-2xl font-bold mb-3">Ready to master German?</h2>
          <p className="mb-6 opacity-85 text-sm">
            Join learners using AI to make German study smarter, not harder.
          </p>
          <Button size="lg" variant="secondary" asChild className="font-semibold">
            <Link to="/register">Create your free account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} GoForDeutsch · Made for A1–A2 German learners
      </footer>
    </div>
  );
}
