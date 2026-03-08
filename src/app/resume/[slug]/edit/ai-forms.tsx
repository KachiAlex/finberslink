"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";

import { AIButton } from "@/components/ai/ai-button";
import { BulletSuggestions } from "@/components/ai/bullet-suggestions";
import { SkillAnalysis } from "@/components/ai/skill-analysis";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ATSActionState,
  BulletActionState,
  CoverLetterActionState,
  SkillActionState,
  SummaryActionState,
} from "./ai-types";

const summaryInitial: SummaryActionState = { status: "idle" };
const bulletsInitial: BulletActionState = { status: "idle" };
const skillInitial: SkillActionState = { status: "idle" };
const atsInitial: ATSActionState = { status: "idle" };
const coverInitial: CoverLetterActionState = { status: "idle" };

type SummaryAction = (
  prevState: SummaryActionState,
  formData: FormData
) => Promise<SummaryActionState>;

type BulletAction = (
  prevState: BulletActionState,
  formData: FormData
) => Promise<BulletActionState>;

type SkillAction = (prevState: SkillActionState, formData: FormData) => Promise<SkillActionState>;
type ATSAction = (prevState: ATSActionState, formData: FormData) => Promise<ATSActionState>;
type CoverLetterAction = (
  prevState: CoverLetterActionState,
  formData: FormData
) => Promise<CoverLetterActionState>;

interface SummaryAIFormProps {
  slug: string;
  currentSummary: string;
  action: SummaryAction;
}

interface ATSAnalysisFormProps {
  slug: string;
  action: ATSAction;
}

export function ATSAnalysisForm({ slug, action }: ATSAnalysisFormProps) {
  const [state, formAction] = useFormState(action, atsInitial);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="slug" value={slug} />
        <div className="space-y-2">
          <Label htmlFor="jobDescription">Job Description</Label>
          <Textarea
            id="jobDescription"
            name="jobDescription"
            rows={5}
            placeholder="Paste the job description you want to match..."
          />
        </div>
        <AIButton variant="default" type="submit">
          Run ATS Analysis
        </AIButton>
      </form>
      {state.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
      {state.status === "success" && state.analysis && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-semibold text-emerald-800">
              Match Score: {state.analysis.matchScore}%
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase">Missing Keywords</p>
            <p className="text-sm text-emerald-900">
              {state.analysis.missingKeywords.join(", ") || "None"}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase">Recommendations</p>
            <ul className="text-sm text-emerald-900 list-disc list-inside space-y-1">
              {state.analysis.recommendations.map((rec) => (
                <li key={rec}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

interface CoverLetterAIFormProps {
  slug: string;
  action: CoverLetterAction;
}

export function CoverLetterAIForm({ slug, action }: CoverLetterAIFormProps) {
  const [state, formAction] = useFormState(action, coverInitial);

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="slug" value={slug} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="company">Company</Label>
            <Input id="company" name="company" placeholder="Company name" />
          </div>
          <div>
            <Label htmlFor="jobDescription">Job Description</Label>
            <Textarea id="jobDescription" name="jobDescription" rows={3} />
          </div>
        </div>
        <AIButton variant="default" type="submit">
          Draft Cover Letter
        </AIButton>
      </form>
      {state.status === "error" && <p className="text-xs text-red-600">{state.message}</p>}
      {state.status === "success" && state.coverLetter && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase text-violet-600">AI Draft</p>
          <pre className="whitespace-pre-wrap text-sm text-violet-900">{state.coverLetter}</pre>
        </div>
      )}
    </div>
  );
}

export function SummaryAIForm({ slug, currentSummary, action }: SummaryAIFormProps) {
  const [state, formAction] = useFormState(action, summaryInitial);

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="summary" value={currentSummary ?? ""} readOnly />
      <AIButton variant="outline" className="w-full" type="submit">
        AI Optimize Summary
      </AIButton>
      {state.message && (
        <p
          className={`text-xs ${
            state.status === "error" ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}

interface ExperienceBulletsAIFormProps {
  slug: string;
  experienceId: string;
  action: BulletAction;
  onApply: (input: { slug: string; experienceId: string; bullets: string[] }) => Promise<void>;
}

export function ExperienceBulletsAIForm({
  slug,
  experienceId,
  action,
  onApply,
}: ExperienceBulletsAIFormProps) {
  const [state, formAction] = useFormState(action, bulletsInitial);
  const [visible, setVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isApplying, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success" && state.bulletPoints && state.experienceId === experienceId) {
      setSuggestions(state.bulletPoints);
      setVisible(true);
    }
  }, [state, experienceId]);

  const handleAccept = (selectedBullets: string[]) => {
    startTransition(async () => {
      await onApply({ slug, experienceId, bullets: selectedBullets });
      setVisible(false);
      setSuggestions([]);
    });
  };

  const handleReject = () => {
    setVisible(false);
    setSuggestions([]);
  };

  return (
    <div className="space-y-3">
      <form action={formAction} className="flex justify-end">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="experienceId" value={experienceId} />
        <AIButton variant="outline" size="sm" type="submit">
          AI Generate Better Bullets
        </AIButton>
      </form>
      {state.status === "error" && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}
      {visible && suggestions.length > 0 && (
        <BulletSuggestions
          suggestions={suggestions}
          onAccept={handleAccept}
          onReject={handleReject}
          isLoading={isApplying}
        />
      )}
    </div>
  );
}

interface SkillAnalysisFormProps {
  slug: string;
  action: SkillAction;
  onApply: (input: { slug: string; hard: string[]; soft: string[]; suggested: string[] }) => Promise<void>;
}

export function SkillAnalysisForm({ slug, action, onApply }: SkillAnalysisFormProps) {
  const [state, formAction] = useFormState(action, skillInitial);
  const [visible, setVisible] = useState(false);
  const [analysis, setAnalysis] = useState<SkillActionState["analysis"]>(undefined);
  const [isApplying, startTransition] = useTransition();

  useEffect(() => {
    if (state.status === "success" && state.analysis) {
      setAnalysis(state.analysis);
      setVisible(true);
    }
  }, [state]);

  const handleAccept = (selected: { hard: string[]; soft: string[]; suggested: string[] }) => {
    startTransition(async () => {
      await onApply({
        slug,
        hard: selected.hard,
        soft: selected.soft,
        suggested: selected.suggested,
      });
      setVisible(false);
      setAnalysis(undefined);
    });
  };

  const handleReject = () => {
    setVisible(false);
    setAnalysis(undefined);
  };

  return (
    <div className="space-y-6">
      {visible && analysis && (
        <SkillAnalysis
          analysis={analysis}
          onAccept={handleAccept}
          onReject={handleReject}
          isLoading={isApplying}
        />
      )}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="slug" value={slug} />
        <div>
          <Label htmlFor="experience">Experience Summary</Label>
          <Textarea
            id="experience"
            name="experience"
            placeholder="Paste your work experience descriptions here..."
            rows={4}
          />
          <p className="text-xs text-slate-500 mt-1">
            AI will analyze this to identify your skills and suggest improvements
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="targetRole">Target Role (optional)</Label>
            <Input
              id="targetRole"
              name="targetRole"
              placeholder="e.g., Software Engineer, Product Manager"
            />
          </div>
          <div>
            <Label htmlFor="jobDescription">Job Description (optional)</Label>
            <Input
              id="jobDescription"
              name="jobDescription"
              placeholder="Paste job description for targeted analysis"
            />
          </div>
        </div>
        <AIButton variant="default" type="submit">
          Analyze My Skills
        </AIButton>
      </form>
      {state.status === "error" && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}
    </div>
  );
}
