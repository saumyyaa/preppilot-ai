"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  BriefcaseBusiness,
  FileText,
  Wand2,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const SAMPLE_JD = `We are hiring a Product Engineer Intern to build features across frontend and backend.
Skills: JavaScript/TypeScript, React/Next.js, REST APIs, SQL, Git, basic DSA.
Nice to have: Docker, CI/CD, cloud deployment experience.`;

export default function Home() {
  const router = useRouter();

  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [level, setLevel] = useState<"Intern" | "Fresher" | "Experienced">("Intern");
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState("");

  const jdCount = jobDescription.length;
  const resumeCount = resumeText.length;

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const canGenerate = useMemo(() => jobDescription.trim().length >= 30 && !loading, [jobDescription, loading]);

  async function handleGenerate() {
    setError("");

    if (!backendUrl) {
      setError("Backend URL missing. Set NEXT_PUBLIC_BACKEND_URL in .env.local / Vercel env.");
      return;
    }

    if (jobDescription.trim().length < 30) {
      setError("Please paste a valid Job Description (min 30 characters).");
      return;
    }

    setLoading(true);
    setStatusText("Analyzing job requirements…");

    try {
      await new Promise((r) => setTimeout(r, 350));
      setStatusText("Mapping skills to interview expectations…");

      const res = await fetch(`${backendUrl}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: jobDescription,
          resume_text: resumeText,
          level,
        }),
      });

      if (!res.ok) throw new Error("API Error");

      setStatusText("Generating prep pack…");

      const data = await res.json();
      localStorage.setItem("preppilot_result", JSON.stringify(data));
      router.push("/result");
    } catch (e) {
      setError("Generation failed. Check backend logs / OpenRouter key.");
    } finally {
      setLoading(false);
      setStatusText("");
    }
  }

  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-indigo-500/25 to-cyan-500/25 blur-3xl" />
        <div className="absolute bottom-[-180px] left-[-120px] h-[420px] w-[420px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-[-200px] right-[-140px] h-[460px] w-[460px] rounded-full bg-fuchsia-500/20 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="relative z-10 mx-auto max-w-6xl px-6 pt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Sparkles className="h-4 w-4" />
            <span className="font-medium">PrepPilot</span>
            <span className="text-white/40">•</span>
            <span className="text-white/60">PydanticAI Interview Coach</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70">
            <span className="inline-flex items-center gap-1">
              <Wand2 className="h-3.5 w-3.5" /> Structured output
            </span>
            <span className="text-white/30">|</span>
            <span>Retries + fallback</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-10">
        {/* Hero */}
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Turn any JD into a{" "}
              <span className="bg-gradient-to-r from-fuchsia-300 via-indigo-200 to-cyan-200 bg-clip-text text-transparent">
                premium interview prep pack
              </span>
              .
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/70 sm:text-lg">
              Paste a Job Description + Resume and get skill mapping, technical questions with answer outlines,
              HR questions, resume improvements, and a 7-day plan.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <Chip icon={<BriefcaseBusiness className="h-4 w-4" />} text="JD Skill Extraction" />
              <Chip icon={<FileText className="h-4 w-4" />} text="Resume Fit Analysis" />
              <Chip icon={<Sparkles className="h-4 w-4" />} text="Interview Questions + Answers" />
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <p className="text-sm font-medium text-white/80">Quick actions</p>
            <div className="mt-3 grid gap-3">
              <button
                type="button"
                onClick={() => setJobDescription(SAMPLE_JD)}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10 transition"
              >
                <div className="font-semibold text-white">Try sample JD</div>
                <div className="text-xs text-white/60">Instant demo content to test output</div>
              </button>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs text-white/60">Role level</div>
                <select
                  id="level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0B1020] px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-400/40"
                >
                  <option className="bg-[#0B1020]">Intern</option>
                  <option className="bg-[#0B1020]">Fresher</option>
                  <option className="bg-[#0B1020]">Experienced</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
          <div className="grid gap-6 lg:grid-cols-2">
            <Field
              title="Job Description"
              subtitle="Paste the JD you’re applying for."
              id="jd"
              value={jobDescription}
              onChange={setJobDescription}
              placeholder="Paste Job Description here…"
              count={jdCount}
              required
            />

            <Field
              title="Resume"
              subtitle="Optional: paste your resume text."
              id="resume"
              value={resumeText}
              onChange={setResumeText}
              placeholder="Paste resume text here (optional)…"
              count={resumeCount}
            />
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-none" />
              <div className="text-sm">
                <div className="font-semibold">Something went wrong</div>
                <div className="text-red-200/80">{error}</div>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-white/60">
              Tip: Provide resume text for stronger personalization.
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:opacity-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {statusText || "Generating…"}
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate Interview Pack
                  <span className="ml-1 inline-flex rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium">
                    v1
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        <footer className="mt-10 text-center text-xs text-white/50">
          Built with <span className="text-white/70">FastAPI + PydanticAI + OpenRouter</span> • Deployed on Vercel/Render
        </footer>
      </section>
    </main>
  );
}

function Chip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/75">
      {icon}
      <span>{text}</span>
    </div>
  );
}

function Field({
  title,
  subtitle,
  id,
  value,
  onChange,
  placeholder,
  count,
  required,
}: {
  title: string;
  subtitle: string;
  id: string;
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
  count: number;
  required?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <label htmlFor={id} className="text-sm font-semibold text-white">
            {title} {required ? <span className="text-fuchsia-200">*</span> : null}
          </label>
          <div className="text-xs text-white/60">{subtitle}</div>
        </div>
        <div className="text-xs text-white/50">{count.toLocaleString()} chars</div>
      </div>

      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-4 min-h-[220px] w-full resize-none rounded-2xl border border-white/10 bg-[#0B1020] p-4 text-sm text-white/90 outline-none placeholder:text-white/30 focus:ring-2 focus:ring-indigo-400/40"
      />
    </div>
  );
}
