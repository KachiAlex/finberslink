"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Textarea } from "../../../components/ui/textarea";
import { Sparkles, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface ResumeBullet {
  id: string;
  text: string;
  original?: string;
  improved?: string;
}

interface ResumeData {
  title: string;
  summary: string;
  skills: string[];
  experience: Array<{
    id: string;
    title: string;
    company: string;
    description: string;
    bullets: ResumeBullet[];
  }>;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    field: string;
    description: string;
  }>;
  certifications?: string[];
}

export default function ResumeBuilderPage() {
  const [data, setData] = useState<ResumeData>({
    title: "",
    summary: "",
    skills: [],
    experience: [],
    education: [],
    certifications: [],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSummaryGenerate = async () => {
    if (!data.experience.length) {
      setMessage({ type: "error", text: "Please add experience first" });
      return;
    }

    setLoading(true);
    try {
      const experienceText = data.experience
        .map((exp) => `${exp.title} at ${exp.company}: ${exp.description}`)
        .join(". ");

      const res = await fetch("/api/resumes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "summary",
          input: {
            experience: experienceText,
            skills: data.skills.join(", "),
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to generate summary");
      const result = await res.json();

      setData((prev) => ({
        ...prev,
        summary: result.summary || prev.summary,
      }));

      setMessage({ type: "success", text: "Summary generated!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate summary" });
    } finally {
      setLoading(false);
    }
  };

  const handleSkillsExtract = async () => {
    if (!data.experience.length && !data.summary) {
      setMessage({ type: "error", text: "Please add experience or summary first" });
      return;
    }

    setLoading(true);
    try {
      const resumeText = [
        data.summary,
        ...data.experience.map(
          (exp) => `${exp.title} at ${exp.company}: ${exp.description}`
        ),
      ].join(". ");

      const res = await fetch("/api/resumes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "extract-skills",
          input: { resumeText },
        }),
      });

      if (!res.ok) throw new Error("Failed to extract skills");
      const result = await res.json();

      setData((prev) => ({
        ...prev,
        skills: [...new Set([...prev.skills, ...result.skills])],
      }));

      setMessage({ type: "success", text: "Skills extracted!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to extract skills" });
    } finally {
      setLoading(false);
    }
  };

  const handleBulletsImprove = async (experienceId: string) => {
    const exp = data.experience.find((e) => e.id === experienceId);
    if (!exp || !exp.bullets.length) {
      setMessage({ type: "error", text: "Please add bullets first" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/resumes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "bullets",
          input: {
            jobTitle: exp.title,
            bullets: exp.bullets.map((b) => b.text),
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to improve bullets");
      const result = await res.json();

      setData((prev) => ({
        ...prev,
        experience: prev.experience.map((e) => {
          if (e.id !== experienceId) return e;
          return {
            ...e,
            bullets: e.bullets.map((b, i) => ({
              ...b,
              improved: result.bullets[i] || b.text,
            })),
          };
        }),
      }));

      setMessage({ type: "success", text: "Bullets improved!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to improve bullets" });
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeATS = async () => {
    if (!data.summary && !data.experience.length) {
      setMessage({ type: "error", text: "Please add content first" });
      return;
    }

    setLoading(true);
    try {
      const resumeText = [
        data.title,
        data.summary,
        data.skills.join(", "),
        ...data.experience.map(
          (exp) =>
            `${exp.title} at ${exp.company}: ${exp.description}. ${exp.bullets.map((b) => b.text).join(". ")}`
        ),
      ].join(". ");

      const res = await fetch("/api/resumes/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "optimize",
          input: { resumeText },
        }),
      });

      if (!res.ok) throw new Error("Failed to optimize");
      const result = await res.json();

      setData((prev) => ({
        ...prev,
        summary: result.optimizedSummary || prev.summary,
      }));

      setMessage({ type: "success", text: "Resume optimized for ATS!" });
    } catch (error) {
      setMessage({ type: "error", text: "Failed to optimize resume" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="rounded-4xl relative overflow-hidden border border-slate-200 bg-gradient-to-br from-purple-50 to-slate-50 p-8 shadow-lg shadow-slate-200/70">
        <div className="absolute -right-16 top-6 h-48 w-48 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-400/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.45em] text-slate-500">Resume Builder</p>
          <h1 className="mt-3 text-4xl font-semibold text-slate-900 sm:text-5xl">
            Create Your Professional Resume
          </h1>
          <p className="mt-3 max-w-2xl text-base text-slate-600">
            Use AI-powered tools to craft and optimize your resume for maximum impact.
          </p>
        </div>
      </header>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 ${
            message.type === "success"
              ? "bg-green-50 border border-green-200"
              : "bg-red-50 border border-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <p
            className={
              message.type === "success"
                ? "text-green-800"
                : "text-red-800"
            }
          >
            {message.text}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">Resume Title</h2>
            <Input
              placeholder="e.g., Full Stack Developer Resume"
              value={data.title}
              onChange={(e) =>
                setData((prev) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Professional Summary</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSummaryGenerate}
                disabled={loading}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? "Generating..." : "Generate"}
              </Button>
            </div>
            <Textarea
              placeholder="Write a compelling summary of your professional background..."
              value={data.summary}
              onChange={(e) =>
                setData((prev) => ({ ...prev, summary: e.target.value }))
              }
              rows={6}
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Skills</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={handleSkillsExtract}
                disabled={loading}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? "Extracting..." : "Extract"}
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-700"
                  >
                    {skill}
                    <button
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          skills: prev.skills.filter((_, i) => i !== index),
                        }))
                      }
                      className="ml-2 text-slate-500 hover:text-slate-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <Input
                placeholder="Add a skill and press Enter..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    const input = e.currentTarget;
                    if (input.value.trim()) {
                      setData((prev) => ({
                        ...prev,
                        skills: [...prev.skills, input.value.trim()],
                      }));
                      input.value = "";
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Experience</h2>
              <Button
                size="sm"
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    experience: [
                      ...prev.experience,
                      {
                        id: Date.now().toString(),
                        title: "",
                        company: "",
                        description: "",
                        bullets: [],
                      },
                    ],
                  }))
                }
              >
                + Add Experience
              </Button>
            </div>
            <div className="space-y-4">
              {data.experience.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="Job Title"
                      value={exp.title}
                      onChange={(event) =>
                        setData((prev) => ({
                          ...prev,
                          experience: prev.experience.map((entry, i) =>
                            i === idx ? { ...entry, title: event.target.value } : entry
                          ),
                        }))
                      }
                    />
                    <Input
                      placeholder="Company"
                      value={exp.company}
                      onChange={(event) =>
                        setData((prev) => ({
                          ...prev,
                          experience: prev.experience.map((entry, i) =>
                            i === idx ? { ...entry, company: event.target.value } : entry
                          ),
                        }))
                      }
                    />
                  </div>
                  <Textarea
                    placeholder="Job description..."
                    value={exp.description}
                    onChange={(event) =>
                      setData((prev) => ({
                        ...prev,
                        experience: prev.experience.map((entry, i) =>
                          i === idx ? { ...entry, description: event.target.value } : entry
                        ),
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulletsImprove(exp.id)}
                    disabled={loading}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Improve Bullets
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Education</h2>
              <Button
                size="sm"
                onClick={() =>
                  setData((prev) => ({
                    ...prev,
                    education: [
                      ...prev.education,
                      {
                        id: Date.now().toString(),
                        school: "",
                        degree: "",
                        field: "",
                        description: "",
                      },
                    ],
                  }))
                }
              >
                + Add Education
              </Button>
            </div>
            <div className="space-y-4">
              {data.education.map((edu, idx) => (
                <div key={edu.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="School / Institution"
                      value={edu.school}
                      onChange={(event) =>
                        setData((prev) => ({
                          ...prev,
                          education: prev.education.map((entry, i) =>
                            i === idx ? { ...entry, school: event.target.value } : entry
                          ),
                        }))
                      }
                    />
                    <Input
                      placeholder="Degree"
                      value={edu.degree}
                      onChange={(event) =>
                        setData((prev) => ({
                          ...prev,
                          education: prev.education.map((entry, i) =>
                            i === idx ? { ...entry, degree: event.target.value } : entry
                          ),
                        }))
                      }
                    />
                  </div>
                  <Input
                    placeholder="Field of study"
                    value={edu.field}
                    onChange={(event) =>
                      setData((prev) => ({
                        ...prev,
                        education: prev.education.map((entry, i) =>
                          i === idx ? { ...entry, field: event.target.value } : entry
                        ),
                      }))
                    }
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={edu.description}
                    onChange={(event) =>
                      setData((prev) => ({
                        ...prev,
                        education: prev.education.map((entry, i) =>
                          i === idx ? { ...entry, description: event.target.value } : entry
                        ),
                      }))
                    }
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          education: prev.education.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">Certifications</h2>
            <div className="space-y-2">
              <p className="text-sm text-slate-500">List each certificate on a new line. These will be copied into your resume.</p>
              <Textarea
                placeholder="Certificate A\nCertificate B"
                rows={4}
                value={(data.certifications || []).join('\n')}
                onChange={(e) =>
                  setData((prev) => ({ ...prev, certifications: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) }))
                }
              />
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/profile', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ certifications: data.certifications || [] }),
                      });
                      if (!res.ok) throw new Error('Failed to save certifications');
                      setMessage({ type: 'success', text: 'Certifications saved to profile' });
                    } catch (err) {
                      setMessage({ type: 'error', text: (err as Error).message || 'Save failed' });
                    }
                  }}
                >
                  Save Qualifications
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 h-fit sticky top-4">
          <h3 className="font-semibold mb-4">AI Tools</h3>
          <div className="space-y-2">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={handleOptimizeATS}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Optimize for ATS
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={handleSkillsExtract}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Extract Skills
            </Button>
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={handleSummaryGenerate}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Generate Summary
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
