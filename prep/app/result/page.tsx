"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  Clipboard,
  ClipboardCheck,
  Sparkles,
  ListChecks,
  Brain,
  FileSearch,
  CalendarDays,
  MessagesSquare,
  Download,
  Loader2,
} from "lucide-react";

type ResultData = {
  role_summary: string;
  required_skills: string[];
  tech_questions: { question: string; answer_outline: string }[];
  hr_questions: string[];
  resume_improvements: string[];
  study_plan: string[];
};

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<ResultData | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("preppilot_result");
    if (!saved) router.push("/");
    else setData(JSON.parse(saved));
  }, [router]);

  const sections = useMemo(
    () => [
      { id: "summary", label: "Summary", icon: <Sparkles className="h-4 w-4" /> },
      { id: "skills", label: "Skills", icon: <ListChecks className="h-4 w-4" /> },
      { id: "tech", label: "Technical", icon: <Brain className="h-4 w-4" /> },
      { id: "hr", label: "HR", icon: <MessagesSquare className="h-4 w-4" /> },
      { id: "resume", label: "Resume", icon: <FileSearch className="h-4 w-4" /> },
      { id: "plan", label: "7-Day Plan", icon: <CalendarDays className="h-4 w-4" /> },
    ],
    []
  );

  function scrollTo(id: string) {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function downloadPDF() {
    if (!data) return;

    setDownloading(true);
    try {
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - margin * 2;

      let y = 18;

      const addTitle = (text: string) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.text(text, margin, y);
        y += 10;
      };

      const addSubTitle = (text: string) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        pdf.setTextColor(90);
        pdf.text(text, margin, y);
        pdf.setTextColor(0);
        y += 8;
      };

      const addSectionHeader = (text: string) => {
        if (y > pageHeight - 25) {
          pdf.addPage();
          y = 18;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.text(text, margin, y);
        y += 7;

        pdf.setDrawColor(220);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 6;
      };

      const addParagraph = (text: string) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);

        const lines = pdf.splitTextToSize(text, contentWidth);
        for (const line of lines) {
          if (y > pageHeight - 18) {
            pdf.addPage();
            y = 18;
          }
          pdf.text(line, margin, y);
          y += 6;
        }
        y += 2;
      };

      const addBullets = (items: string[]) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);

        for (const item of items) {
          const bulletText = `• ${item}`;
          const lines = pdf.splitTextToSize(bulletText, contentWidth);
          for (const line of lines) {
            if (y > pageHeight - 18) {
              pdf.addPage();
              y = 18;
            }
            pdf.text(line, margin, y);
            y += 6;
          }
        }
        y += 2;
      };

      const addNumbered = (items: string[]) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);

        items.forEach((item, idx) => {
          const numberedText = `${idx + 1}. ${item}`;
          const lines = pdf.splitTextToSize(numberedText, contentWidth);
          for (const line of lines) {
            if (y > pageHeight - 18) {
              pdf.addPage();
              y = 18;
            }
            pdf.text(line, margin, y);
            y += 6;
          }
          y += 1;
        });

        y += 2;
      };

      // Cover
      addTitle("PrepPilot — Interview Prep Pack");
      addSubTitle("Generated using PydanticAI + OpenRouter | Full Stack AI Agent");
      addSubTitle(`Generated on: ${new Date().toLocaleString()}`);
      y += 6;

      // Sections
      addSectionHeader("1) Role Summary");
      addParagraph(data.role_summary || "—");

      addSectionHeader("2) Required Skills");
      addBullets(data.required_skills?.length ? data.required_skills : ["—"]);

      addSectionHeader("3) Technical Interview Questions (with Answer Outlines)");
      (data.tech_questions || []).forEach((q, idx) => {
        if (y > pageHeight - 28) {
          pdf.addPage();
          y = 18;
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        const qLines = pdf.splitTextToSize(`${idx + 1}. ${q.question}`, contentWidth);
        qLines.forEach((line: string) => {
          if (y > pageHeight - 18) {
            pdf.addPage();
            y = 18;
          }
          pdf.text(line, margin, y);
          y += 6;
        });

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        const aLines = pdf.splitTextToSize(`Answer outline: ${q.answer_outline}`, contentWidth);
        aLines.forEach((line: string) => {
          if (y > pageHeight - 18) {
            pdf.addPage();
            y = 18;
          }
          pdf.text(line, margin, y);
          y += 6;
        });

        y += 3;
      });

      addSectionHeader("4) HR Questions");
      addNumbered(data.hr_questions?.length ? data.hr_questions : ["—"]);

      addSectionHeader("5) Resume Improvements");
      addBullets(data.resume_improvements?.length ? data.resume_improvements : ["—"]);

      addSectionHeader("6) 7-Day Study Plan");
      (data.study_plan || []).forEach((step, idx) => {
        if (y > pageHeight - 18) {
          pdf.addPage();
          y = 18;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.text(`Day ${idx + 1}`, margin, y);
        y += 6;

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
        const lines = pdf.splitTextToSize(step, contentWidth);
        lines.forEach((line: string) => {
          if (y > pageHeight - 18) {
            pdf.addPage();
            y = 18;
          }
          pdf.text(line, margin, y);
          y += 6;
        });

        y += 3;
      });

      // Footer
      if (y > pageHeight - 18) {
        pdf.addPage();
        y = 18;
      }
      y += 6;
      pdf.setDrawColor(220);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(120);
      pdf.text(
        "Generated by PrepPilot • Full Stack AI Agent (FastAPI + PydanticAI + Next.js)",
        margin,
        y
      );
      pdf.setTextColor(0);

      pdf.save("PrepPilot_Interview_Prep_Pack.pdf");
    } catch {
      alert("Professional PDF export failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#070A12] text-white p-6">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-1/2 rounded bg-white/10" />
            <div className="h-24 w-full rounded bg-white/10" />
            <div className="h-24 w-full rounded bg-white/10" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070A12] text-white">
      {/* BG */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500/25 via-indigo-500/25 to-cyan-500/25 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              PydanticAI Structured Output
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Interview Prep Pack
            </h1>
            <p className="mt-2 text-white/65">
              A tailored plan built from your JD + resume.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
            >
              <ArrowLeft className="h-4 w-4" /> New
            </button>

            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition disabled:opacity-60"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloading ? "Preparing PDF…" : "Download PDF"}
            </button>

            <CopyButton getText={() => JSON.stringify(data, null, 2)} label="Copy JSON" />
          </div>
        </div>

        {/* Layout */}
        <div className="mt-10 grid gap-8 lg:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-8 h-fit rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs font-semibold text-white/70">Navigate</p>
            <div className="mt-3 grid gap-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white/80 hover:bg-white/10 transition"
                >
                  <span className="text-white/70">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>

            <div className="mt-4 text-[11px] text-white/45 leading-relaxed">
              Tip: Export the report using <span className="text-white/70 font-semibold">Download PDF</span>.
            </div>
          </aside>

          {/* Content */}
          <div className="space-y-6">
            <Section id="summary" title="Role Summary" subtitle="A short snapshot of what the company expects." copyText={data.role_summary}>
              <p className="text-white/80 leading-relaxed">{data.role_summary}</p>
            </Section>

            <Section id="skills" title="Required Skills" subtitle="Core skills extracted from the JD." copyText={data.required_skills.join("\n")}>
              <div className="flex flex-wrap gap-2">
                {data.required_skills.map((s, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/75">
                    {s}
                  </span>
                ))}
              </div>
            </Section>

            <Section
              id="tech"
              title="Technical Questions"
              subtitle="Questions + answer outlines tailored to the JD."
              copyText={data.tech_questions.map((q, i) => `${i + 1}. ${q.question}\n${q.answer_outline}`).join("\n\n")}
            >
              <div className="space-y-3">
                {data.tech_questions.map((q, i) => (
                  <details key={i} className="group rounded-2xl border border-white/10 bg-white/[0.04] p-4 open:bg-white/[0.06] transition">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-white/90">
                      <span className="text-white/50 mr-2">{String(i + 1).padStart(2, "0")}.</span>
                      {q.question}
                      <span className="float-right text-xs text-white/40 group-open:hidden">Open</span>
                      <span className="float-right text-xs text-white/40 hidden group-open:inline">Close</span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-white/75">{q.answer_outline}</p>
                  </details>
                ))}
              </div>
            </Section>

            <Section id="hr" title="HR Questions" subtitle="Behavioral prompts you should prepare." copyText={data.hr_questions.join("\n")}>
              <ol className="space-y-2">
                {data.hr_questions.map((q, i) => (
                  <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                    <span className="text-white/50 mr-2">{i + 1}.</span> {q}
                  </li>
                ))}
              </ol>
            </Section>

            <Section id="resume" title="Resume Improvements" subtitle="Fixes to increase shortlisting probability." copyText={data.resume_improvements.join("\n")}>
              <ul className="space-y-2">
                {data.resume_improvements.map((s, i) => (
                  <li key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/80">
                    {s}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="plan" title="7-Day Study Plan" subtitle="A clear day-wise execution plan." copyText={data.study_plan.join("\n")}>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.study_plan.map((s, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-xs font-semibold text-white/60">Day {i + 1}</div>
                    <div className="mt-2 text-sm text-white/80 leading-relaxed">{s}</div>
                  </div>
                ))}
              </div>
            </Section>

            <div className="text-center text-xs text-white/45 pt-6">
              PrepPilot • FastAPI + PydanticAI + OpenRouter • Built for assessment submission
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  id,
  title,
  subtitle,
  children,
  copyText,
}: {
  id: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  copyText: string;
}) {
  return (
    <section id={id} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-white/60">{subtitle}</p>
        </div>
        <CopyButton getText={() => copyText} label="Copy" />
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function CopyButton({ getText, label }: { getText: () => string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 900);
    } catch {}
  }

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
    >
      {copied ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
      {label}
    </button>
  );
}
