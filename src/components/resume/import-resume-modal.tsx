"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, AlertCircle, CheckCircle, Zap } from "lucide-react";
import { importResume } from "@/features/resume/service";
import { requireSession } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ATSResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  suggestions: string[];
  overallFeedback: string;
}

export function ImportResumeModal() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [extractedContent, setExtractedContent] = useState<{
    text: string;
    fileName: string;
  } | null>(null);
  const [atsResult, setATSResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"upload" | "analyze" | "create">("upload");
  const [jobDescription, setJobDescription] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    personaName: "",
    location: "",
    summary: "",
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError("");
    setLoading(true);

    try {
      // Validate file size
      if (selectedFile.size > 5 * 1024 * 1024) {
        throw new Error("File size must be less than 5MB");
      }

      // Validate file type
      const supportedTypes = ["application/pdf", "text/plain"];
      const isSupported = supportedTypes.includes(selectedFile.type) || 
                         selectedFile.name.endsWith(".pdf") || 
                         selectedFile.name.endsWith(".txt");
      
      if (!isSupported) {
        throw new Error("Please upload a PDF or TXT file");
      }

      let text = "";

      // Try client-side parsing first
      try {
        text = await parseResumeFile(selectedFile);
      } catch (clientErr) {
        // Client-side parsing failed, try server-side fallback
        console.warn("[ImportResume] Client-side parsing failed, trying server-side:", clientErr);
        
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);
          const response = await fetch("/api/resume/parse", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || `Server parsing failed with status ${response.status}`
            );
          }

          const result = await response.json();
          text = result.text;
        } catch (serverErr) {
          // Both client and server parsing failed
          const clientMsg = (clientErr as Error).message;
          const serverMsg = (serverErr as Error).message;
          throw new Error(`Failed to parse file: ${clientMsg}. ${serverMsg}`);
        }
      }

      // Validate extracted text
      if (!text || text.trim().length === 0) {
        throw new Error("No text content could be extracted from the file");
      }

      setFile(selectedFile);
      setRawText(text);
      setExtractedContent({
        text,
        fileName: selectedFile.name,
      });
      setFormData((prev) => ({
        ...prev,
        title: selectedFile.name.replace(/\.[^/.]+$/, ""),
      }));
    } catch (err) {
      const errorMsg = (err as Error).message || "Failed to parse resume file";
      setError(errorMsg);
      console.error("[ImportResume] File selection error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeATS = async () => {
    if (!rawText || !jobDescription) {
      setError("Please provide both resume content and job description");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { analysis, usedFallback } = await analyzeATSMatch({
        resumeContent: rawText,
        jobDescription,
      });

      setATSResult({
        score: Math.round(analysis.matchScore || 0),
        matchedKeywords: analysis.strongMatches || [],
        missingKeywords: analysis.missingKeywords || [],
        suggestions: analysis.recommendations || analysis.improvements || [],
        overallFeedback: usedFallback
          ? "Using fallback ATS analysis. Review recommendations before applying changes."
          : "Resume analyzed successfully.",
      });

      setStep("analyze");
    } catch (err) {
      setError((err as Error).message || "Failed to analyze resume");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResume = async () => {
    if (!rawText) {
      setError("Resume content is required");
      return;
    }

    if (!formData.title) {
      setError("Resume title is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/resume/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          personaName: formData.personaName,
          location: formData.location,
          summary: formData.summary || rawText.substring(0, 500),
          rawContent: rawText,
          atsAnalysis: atsResult,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      setOpen(false);
      // Refresh the page to show the new resume
      window.location.reload();
    } catch (err) {
      setError((err as Error).message || "Failed to create resume");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setRawText("");
    setExtractedContent(null);
    setATSResult(null);
    setError("");
    setJobDescription("");
    setFormData({
      title: "",
      personaName: "",
      location: "",
      summary: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) handleReset();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          Import Resume
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import & Analyze Resume</DialogTitle>
          <DialogDescription>
            Upload your resume to get ATS analysis and recommendations
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload & Job Description */}
        {step === "upload" && (
          <div className="space-y-6">
            {/* File Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload Resume</CardTitle>
                <CardDescription>Supports PDF and TXT files (max 5MB)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileSelect}
                    disabled={loading}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer block">
                    {!extractedContent ? (
                      <>
                        <Upload className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                        <p className="font-semibold text-slate-900">Drop your resume here</p>
                        <p className="text-sm text-slate-500">or click to browse</p>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-10 w-10 text-green-600 mx-auto mb-3" />
                        <p className="font-semibold text-slate-900">{extractedContent.fileName}</p>
                        <p className="text-sm text-slate-500">Loaded successfully</p>
                      </>
                    )}
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Job Description */}
            {extractedContent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Job Description (Optional)</CardTitle>
                  <CardDescription>Paste the job description to get targeted recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-40"
                  />
                </CardContent>
              </Card>
            )}

            {/* Error Alert */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              {extractedContent && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setExtractedContent(null);
                      setFile(null);
                      setRawText("");
                      setJobDescription("");
                      setError("");
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleAnalyzeATS}
                    disabled={loading}
                    className="gap-2"
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Analyze ATS Score
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Step 2: ATS Analysis Results */}
        {step === "analyze" && atsResult && (
          <div className="space-y-6">
            {/* Score Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  ATS Compatibility Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="text-5xl font-bold text-blue-600">{atsResult.score}%</div>
                  <div className="flex-1">
                    <div className="w-full bg-blue-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${atsResult.score}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{atsResult.overallFeedback}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Matched Keywords */}
            {atsResult.matchedKeywords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-green-700">✓ Matched Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {atsResult.matchedKeywords.slice(0, 10).map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="bg-green-100 text-green-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Missing Keywords */}
            {atsResult.missingKeywords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base text-orange-700">⚠ Missing Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {atsResult.missingKeywords.slice(0, 10).map((keyword) => (
                      <Badge key={keyword} variant="outline" className="border-orange-300 text-orange-700">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {atsResult.suggestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">💡 Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {atsResult.suggestions.slice(0, 5).map((suggestion, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-slate-700">
                        <span className="text-slate-400 font-semibold">{idx + 1}.</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Error Alert */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={() => setStep("create")}
                disabled={loading}
              >
                Create Resume
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Create Resume */}
        {step === "create" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resume Details</CardTitle>
                <CardDescription>Customize your resume information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Resume Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Frontend Developer Resume"
                  />
                </div>
                <div>
                  <Label htmlFor="personaName">Your Name</Label>
                  <Input
                    id="personaName"
                    value={formData.personaName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, personaName: e.target.value }))}
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                    placeholder="Brief summary of your professional background"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Error Alert */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setStep("analyze")}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleCreateResume}
                disabled={loading}
                className="gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Resume
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
