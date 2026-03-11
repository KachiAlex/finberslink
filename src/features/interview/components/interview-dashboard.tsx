"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Mic,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateInterviewSession,
  useInterviewSessions,
  type InterviewSession,
} from "@/features/interview/hooks";
import { cn } from "@/lib/utils";

interface InterviewPrepDashboardProps {
  userName?: string | null;
}

export function InterviewPrepDashboard({ userName }: InterviewPrepDashboardProps) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <InterviewPrepContent userName={userName} />
    </QueryClientProvider>
  );
}

interface ResumeOption {
  id: string;
  title: string;
  slug?: string | null;
}

interface JobOption {
  id: string;
  title: string;
  company: string;
  slug?: string | null;
}

interface InterviewPrepContentProps {
  userName?: string | null;
}

const statusThemes: Record<InterviewSession["status"], string> = {
  PENDING: "bg-slate-100 text-slate-700 border-slate-200",
  ACTIVE: "bg-indigo-100 text-indigo-700 border-indigo-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-700 border-rose-200",
};

const stepCopy: Record<InterviewSession["currentStep"], string> = {
  QUESTION_PHASE: "In question practice",
  FEEDBACK_PHASE: "Reviewing feedback",
  RATING_PHASE: "Rating & wrap-up",
};

const initialFormState = {
  targetRole: "",
  resumeId: "",
  jobOpportunityId: "",
  initialQuestion: "",
};

type CreateFormState = typeof initialFormState;

function InterviewPrepContent({ userName }: InterviewPrepContentProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateFormState>(initialFormState);
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: sessions = [], isLoading: sessionsLoading } = useInterviewSessions();
  const createSession = useCreateInterviewSession();

  useEffect(() => {
    let mounted = true;
    async function loadOptions() {
      setOptionsLoading(true);
      setOptionsError(null);
      try {
        const [resumeRes, jobRes] = await Promise.all([
          fetch("/api/resume", { cache: "no-store" }),
          fetch("/api/jobs?limit=8", { cache: "no-store" }),
        ]);

        if (!resumeRes.ok || !jobRes.ok) {
          throw new Error("Failed to load supporting data");
        }

        const [resumePayload, jobPayload] = await Promise.all([resumeRes.json(), jobRes.json()]);

        if (!mounted) return;

        setResumes(
          (resumePayload?.resumes ?? []).map((resume: ResumeOption) => ({
            id: resume.id,
            title: resume.title,
            slug: resume.slug,
          })),
        );

        setJobs(
          (jobPayload?.jobs ?? []).map((job: JobOption) => ({
            id: job.id,
            title: job.title,
            company: job.company,
            slug: job.slug,
          })),
        );
      } catch (error) {
        console.error("Interview options load error", error);
        if (mounted) setOptionsError("We couldn't load resumes or jobs. Try refreshing.");
      } finally {
        if (mounted) setOptionsLoading(false);
      }
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = sessions.length;
    const active = sessions.filter((session) => session.status === "ACTIVE").length;
    const completed = sessions.filter((session) => session.status === "COMPLETED").length;
    const hoursSaved = total * 0.6;
    return { total, active, completed, hoursSaved: hoursSaved.toFixed(1) };
  }, [sessions]);

  const sortedSessions = useMemo(
    () =>
      [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [sessions],
  );

  const handleFieldChange = (field: keyof CreateFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleCreateSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!form.targetRole.trim()) {
      setFormError("Target role is required");
      return;
    }

    try {
      await createSession.mutateAsync({
        targetRole: form.targetRole.trim(),
        resumeId: form.resumeId || undefined,
        jobOpportunityId: form.jobOpportunityId || undefined,
        initialQuestion: form.initialQuestion.trim()
          ? { prompt: form.initialQuestion.trim() }
          : undefined,
      });

      setForm(initialFormState);
      setCreateOpen(false);
    } catch (error) {
      console.error("Interview session create error", error);
      setFormError(error instanceof Error ? error.message : "Unable to create interview session");
    }
  }

  const heroTitle = userName ? `${userName}'s AI interview studio` : "AI Interview Studio";

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-cyan-50 p-8 shadow-sm shadow-slate-200/60">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-slate-500">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span>Interview prep</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 sm:text-5xl">{heroTitle}</h1>
            <p className="text-base text-slate-600">
              Run structured mock interviews, respond with audio, and let Finbers AI distill personalized feedback
              grounded in your resume and target role.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="rounded-full" onClick={() => setCreateOpen((open) => !open)}>
                <Mic className="mr-2 h-4 w-4" /> Start a new mock interview
              </Button>
              <Button size="lg" variant="outline" className="rounded-full" asChild>
                <Link href="/resume/builder">
                  Refresh resume context <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
          <Card className="w-full border-slate-200/80 bg-white/80 backdrop-blur-sm lg:w-80">
            <CardHeader>
              <CardTitle className="text-base text-slate-600">Momentum snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SnapshotStat label="Sessions" value={stats.total} trend="Lifetime" />
              <SnapshotStat label="Active drills" value={stats.active} trend="Today" accent="text-indigo-600" />
              <SnapshotStat label="Completed" value={stats.completed} accent="text-emerald-600" />
              <SnapshotStat label="Hours saved" value={stats.hoursSaved} suffix="hrs" accent="text-slate-700" />
            </CardContent>
          </Card>
        </div>
      </section>

      {createOpen && (
        <Card className="border-indigo-100 bg-white/95">
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
              <Mic className="h-5 w-5 text-indigo-500" />
              Configure a new session
            </CardTitle>
            <p className="text-sm text-slate-500">
              Select the resume and role you want to rehearse. You can link a specific opportunity for tailored prompts.
            </p>
          </CardHeader>
          <CardContent>
            {optionsError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <AlertCircle className="h-4 w-4" /> {optionsError}
              </div>
            )}
            <form onSubmit={handleCreateSession} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="targetRole">
                  Target role *
                </label>
                <Input
                  id="targetRole"
                  value={form.targetRole}
                  onChange={(event) => handleFieldChange("targetRole", event.target.value)}
                  placeholder="e.g. Product Manager, Robotics"
                  disabled={createSession.isPending}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="resumeId">
                  Resume context
                </label>
                <select
                  id="resumeId"
                  value={form.resumeId}
                  onChange={(event) => handleFieldChange("resumeId", event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={optionsLoading || createSession.isPending}
                >
                  <option value="">Select a resume (optional)</option>
                  {resumes.map((resume) => (
                    <option key={resume.id} value={resume.id}>
                      {resume.title}
                    </option>
                  ))}
                </select>
                {!resumes.length && !optionsLoading && (
                  <p className="text-xs text-slate-500">No resumes yet. Use the Resume Studio to create one.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="jobOpportunityId">
                  Tie to a job
                </label>
                <select
                  id="jobOpportunityId"
                  value={form.jobOpportunityId}
                  onChange={(event) => handleFieldChange("jobOpportunityId", event.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={optionsLoading || createSession.isPending}
                >
                  <option value="">Pick a saved role (optional)</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title} · {job.company}
                    </option>
                  ))}
                </select>
                {!jobs.length && !optionsLoading && (
                  <p className="text-xs text-slate-500">No active roles found. Browse jobs to add context.</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700" htmlFor="initialQuestion">
                  Kick-off question (optional)
                </label>
                <Textarea
                  id="initialQuestion"
                  value={form.initialQuestion}
                  onChange={(event) => handleFieldChange("initialQuestion", event.target.value)}
                  placeholder="Provide a starter prompt if you already know what you want to practice."
                  className="min-h-[90px]"
                  disabled={createSession.isPending}
                />
              </div>

              {formError && (
                <div className="md:col-span-2 text-sm text-rose-600">{formError}</div>
              )}

              <div className="md:col-span-2 flex items-center gap-3">
                <Button type="submit" disabled={createSession.isPending}>
                  {createSession.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Launching session
                    </>
                  ) : (
                    "Launch session"
                  )}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)} disabled={createSession.isPending}>
                  Cancel
                </Button>
                {optionsLoading && (
                  <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                    <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> Fetching resumes & jobs…
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Sessions</p>
            <h2 className="text-2xl font-semibold text-slate-900">Recent interview runs</h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Auto-synced with AI feedback
          </div>
        </div>

        {sessionsLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, idx) => (
              <Card key={idx} className="animate-pulse border-slate-100 bg-white/80">
                <CardContent className="space-y-4 py-6">
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="h-6 w-1/2 rounded bg-slate-100" />
                  <div className="h-16 rounded bg-slate-50" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sortedSessions.length === 0 ? (
          <Card className="border-dashed border-slate-200 bg-slate-50/80">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Mic className="h-10 w-10 text-slate-400" />
              <p className="text-base font-semibold text-slate-800">No mock interviews yet</p>
              <p className="max-w-md text-sm text-slate-600">
                Launch your first session to get AI-powered feedback on delivery, content depth, and role-specific readiness.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="rounded-full">
                Start now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {sortedSessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SnapshotStat({
  label,
  value,
  suffix,
  trend,
  accent,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/80 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <div className={cn("mt-2 text-2xl font-semibold text-slate-900", accent)}>
        {value}
        {suffix ? <span className="ml-1 text-base font-medium text-slate-500">{suffix}</span> : null}
      </div>
      {trend ? <p className="text-xs text-slate-500">{trend}</p> : null}
    </div>
  );
}

function SessionCard({ session }: { session: InterviewSession }) {
  const lastInteraction = session.questions.at(-1)?.responses.at(-1)?.submittedAt ?? session.updatedAt;
  const questionCount = session.questions.length;
  const responseCount = session.questions.reduce((sum, q) => sum + q.responses.length, 0);

  return (
    <Card className="border-slate-200 bg-white/95">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{stepCopy[session.currentStep]}</p>
            <CardTitle className="text-xl text-slate-900">{session.targetRole}</CardTitle>
          </div>
          <Badge variant="outline" className={cn("border text-xs font-semibold", statusThemes[session.status])}>
            {session.status.toLowerCase()}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-slate-500">
          {session.resume?.title && (
            <Badge className="rounded-full bg-slate-100 text-slate-700" variant="secondary">
              Resume · {session.resume.title}
            </Badge>
          )}
          {session.jobOpportunity?.title && (
            <Badge className="rounded-full bg-indigo-100 text-indigo-700" variant="secondary">
              Role · {session.jobOpportunity.title}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Progress</p>
          <div className="mt-3 flex flex-wrap gap-6 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{questionCount}</span>
            <span>questions</span>
            <span className="font-semibold text-slate-900">{responseCount}</span>
            <span>responses</span>
            {session.rating && (
              <span className="flex items-center gap-1 text-amber-600">
                ★<strong>{session.rating}</strong>/5 self-rating
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">Last activity · {formatRelativeDate(lastInteraction)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" className="rounded-full" variant="default" asChild>
            <Link href={`/dashboard/interview/${session.id}`}>Open session</Link>
          </Button>
          <Button size="sm" variant="ghost" className="text-slate-600" asChild>
            <Link href={`/dashboard/interview/${session.id}#feedback`}>Review feedback</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function formatRelativeDate(value: string) {
  try {
    const date = new Date(value);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Recently";
  }
}
