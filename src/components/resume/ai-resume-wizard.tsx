"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

type Draft = {
  section: string;
  draft: { text: string; bullets?: string[] };
};

export default function AIResumeWizard() {
  const [step, setStep] = useState(0);
  const [role, setRole] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const steps = ["Role / Target", "Summary", "Experience"].slice(0, 3);

  async function generateSection(section: string) {
    setLoading(true);
    try {
      const body: any = { section, consent, targetRole: role };
      if (section === "summary") {
        body.currentSummary = summary;
        body.experience = [];
        body.skills = [];
      }
      const res = await fetch("/api/resume/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      setDraft(json);
    } catch (e) {
      setDraft({ section, draft: { text: "Failed to generate. Try again later." } });
    } finally {
      setLoading(false);
    }
  }

  const handleNext = async () => {
    const current = steps[step];
    if (current === "Role / Target") {
      await generateSection("summary");
    } else if (current === "Summary") {
      await generateSection("experience");
    }
    setStep(Math.min(step + 1, steps.length - 1));
  };

  async function createDraftAndOpen() {
    if (!draft) return;
    setSaving(true);
    try {
      const body = {
        title: `AI Resume - ${new Date().toISOString()}`,
        draft: {
          text: draft.draft.text,
          bullets: draft.draft.bullets,
        },
      };

      const res = await fetch("/api/resume/create-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (res.ok && json?.resume?.slug) {
        router.push(`/resume/${json.resume.slug}/edit`);
        return;
      }

      // Fallback: if we only have an id, try to open by id route
      if (res.ok && json?.resumeId) {
        router.push(`/dashboard/resumes`);
        return;
      }

      alert("Failed to save draft: " + (json?.error || "unknown error"));
    } catch (e) {
      console.error(e);
      alert("Failed to save draft. Check console for details.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded">
        <label className="block text-sm font-medium">Target role / job title</label>
        <input value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full p-2 border rounded" placeholder="e.g. Senior Product Manager" />
      </div>

      <div className="p-4 border rounded">
        <label className="block text-sm font-medium">Brief professional summary (optional)</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} className="mt-1 w-full p-2 border rounded" rows={3} placeholder="Two sentences about experience and goals" />
      </div>

      <div className="flex gap-2">
        <button disabled={loading} onClick={handleNext} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Generate next</button>
        <button disabled={loading} onClick={() => generateSection("summary")} className="px-4 py-2 border rounded">Generate Summary</button>
        <button disabled={loading} onClick={() => generateSection("experience")} className="px-4 py-2 border rounded">Generate Experience</button>
      </div>

      <div className="p-4 border rounded bg-gray-50">
        <h3 className="font-semibold">Draft output</h3>
        {loading && <p className="text-sm text-slate-500">Generating…</p>}
        {!loading && draft && (
          <div>
            <p className="italic text-sm text-slate-600">Section: {draft.section}</p>
            <div className="mt-2 whitespace-pre-wrap">{draft.draft.text}</div>
            {draft.draft.bullets && (
              <ul className="list-disc pl-5 mt-2">{draft.draft.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
            )}
          </div>
        )}
        {!loading && !draft && <p className="text-sm text-slate-500">No draft yet — click Generate.</p>}
      </div>

      <div className="pt-2">
        <p className="text-xs text-slate-500">POC: generated drafts are not yet saved. Use "Create Draft" to implement save behavior.</p>
      </div>
      <div className="pt-2">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>I consent to using an AI provider to generate resume content and accept that content will be stored as a draft.</span>
        </label>
      </div>
      <div className="pt-3 flex gap-2">
        <button
          disabled={saving || !draft}
          onClick={createDraftAndOpen}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          {saving ? "Saving…" : "Create Draft"}
        </button>
      </div>
    </div>
  );
}
