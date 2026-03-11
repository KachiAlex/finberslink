"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Mic,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  type InterviewQuestion,
  type InterviewSession,
  useInterviewSession,
  useRecordInterviewResponse,
  useUpdateInterviewSession,
  useUploadInterviewAudio,
} from "@/features/interview/hooks";
import { useAudioRecorder } from "@/features/interview/hooks/use-audio-recorder";
import { cn } from "@/lib/utils";

interface InterviewSessionViewProps {
  sessionId: string;
}

export function InterviewSessionView({ sessionId }: InterviewSessionViewProps) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <InterviewSessionContent sessionId={sessionId} />
    </QueryClientProvider>
  );
}

function InterviewSessionContent({ sessionId }: InterviewSessionViewProps) {
  const { data: session, isLoading, isError } = useInterviewSession(sessionId);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);

  useEffect(() => {
    if (!session || selectedQuestionId) return;
    const latestQuestion = [...session.questions].sort((a, b) => b.sequence - a.sequence)[0];
    setSelectedQuestionId(latestQuestion?.id ?? null);
  }, [session, selectedQuestionId]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-slate-500">
        <Loader2 className="mb-3 h-6 w-6 animate-spin" />
        Loading interview session…
      </div>
    );
  }

  if (isError || !session) {
    return (
      <Card className="border-rose-100 bg-rose-50/70">
        <CardContent className="flex items-center gap-3 py-8 text-rose-700">
          <AlertCircle className="h-5 w-5" />
          We couldn’t load this interview session. Try refreshing or return to the studio.
        </CardContent>
      </Card>
    );
  }

  const activeQuestion = session.questions.find((question) => question.id === selectedQuestionId) ?? null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4">
        <Link
          href="/dashboard/interview"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to sessions
        </Link>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-200/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                <span>{session.currentStep.replace("_", " ")}</span>
                <span className="h-4 w-px bg-slate-200/50" aria-hidden="true" />
                <span>{session.status.toLowerCase()}</span>
              </div>
              <h1 className="text-3xl font-semibold text-slate-900">{session.targetRole}</h1>
              <p className="text-sm text-slate-600">
                Calibrated to your {session.resume?.title ? `${session.resume.title} resume` : "profile"}
                {session.jobOpportunity?.title ? ` · ${session.jobOpportunity.title}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
              {session.resume?.title && (
                <Badge className="rounded-full bg-slate-100 text-slate-700" variant="secondary">
                  Resume · {session.resume.title}
                </Badge>
              )}
              {session.jobOpportunity?.title && (
                <Badge className="rounded-full bg-indigo-100 text-indigo-700" variant="secondary">
                  Opportunity · {session.jobOpportunity.title}
                </Badge>
              )}
              {typeof session.rating === "number" && (
                <Badge className="rounded-full bg-amber-100 text-amber-700" variant="secondary">
                  ★ {session.rating}/5 self score
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr] xl:grid-cols-[360px,1fr]">
        <QuestionTimeline
          session={session}
          selectedQuestionId={selectedQuestionId}
          onSelectQuestion={setSelectedQuestionId}
        />
        <RecorderWorkspace session={session} question={activeQuestion} />
      </div>

      <SessionReflection session={session} />
    </div>
  );
}

interface QuestionTimelineProps {
  session: InterviewSession;
  selectedQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
}

function QuestionTimeline({ session, selectedQuestionId, onSelectQuestion }: QuestionTimelineProps) {
  const ordered = [...session.questions].sort((a, b) => a.sequence - b.sequence);

  return (
    <Card className="border-slate-200 bg-white/90">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base text-slate-700">Interview flow</CardTitle>
        <p className="text-sm text-slate-500">Navigate prompts and review past answers.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {ordered.map((question) => {
            const hasResponses = question.responses.length > 0;
            const isActive = selectedQuestionId === question.id;
            return (
              <button
                key={question.id}
                type="button"
                onClick={() => onSelectQuestion(question.id)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-3 text-left transition",
                  isActive ? "border-indigo-400 bg-indigo-50" : "border-slate-200 hover:border-slate-300",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Q{question.sequence}
                  </span>
                  {hasResponses ? (
                    <Badge className="rounded-full bg-emerald-100 text-emerald-700" variant="secondary">
                      {question.responses.length} response{question.responses.length > 1 ? "s" : ""}
                    </Badge>
                  ) : (
                    <Badge className="rounded-full bg-slate-100 text-slate-600" variant="secondary">
                      Pending
                    </Badge>
                  )}
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-700">{question.prompt}</p>
              </button>
            );
          })}
        </div>
        {!ordered.length && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
            No questions yet. Add one from the dashboard to start practicing.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecorderWorkspaceProps {
  session: InterviewSession;
  question: InterviewQuestion | null;
}

function RecorderWorkspace({ session, question }: RecorderWorkspaceProps) {
  const recorder = useAudioRecorder();
  const audioUploader = useUploadInterviewAudio(session.id);
  const recordResponse = useRecordInterviewResponse();
  const [transcriptDraft, setTranscriptDraft] = useState("");
  const [aiFeedbackDraft, setAiFeedbackDraft] = useState("");
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [transcriptionNote, setTranscriptionNote] = useState<string | null>(null);

  useEffect(() => {
    if (!question) {
      setTranscriptDraft("");
      setAiFeedbackDraft("");
      setSelfScore(null);
      setSubmissionSuccess(null);
      return;
    }
    const latestResponse = [...question.responses].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )[0];
    setTranscriptDraft(latestResponse?.transcript ?? "");
    setAiFeedbackDraft(latestResponse?.aiFeedback ?? "");
    setSelfScore(latestResponse?.score ?? null);
    setSubmissionSuccess(null);
  }, [question]);

  const timer = formatDuration(recorder.durationMs);
  const sliderValue = selfScore ?? 3;

  async function handleSubmitResponse() {
    if (!question) return;
    if (!transcriptDraft.trim()) {
      setSubmissionError("Transcript is required before saving");
      return;
    }

    setSubmissionError(null);
    setSubmissionSuccess(null);

    try {
      let uploadedAudioUrl: string | undefined;
      let transcriptText = transcriptDraft.trim();

      if (recorder.blob) {
        setTranscriptionNote("Uploading audio & transcribing…");
        const result = await audioUploader.mutateAsync({
          questionId: question.id,
          file: new File([recorder.blob], `interview-${question.id}.webm`, {
            type: "audio/webm",
          }),
        });
        uploadedAudioUrl = result.audioUrl;
        if (result.transcript) {
          transcriptText = result.transcript;
          setTranscriptDraft(result.transcript);
        }
        setTranscriptionNote("Upload complete");
      }

      await recordResponse.mutateAsync({
        sessionId: session.id,
        questionId: question.id,
        transcript: transcriptText,
        audioUrl: uploadedAudioUrl,
        aiFeedback: aiFeedbackDraft.trim() || undefined,
        score: typeof selfScore === "number" ? selfScore : undefined,
      });

      setSubmissionSuccess("Response saved");
      recorder.reset();
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "Unable to save response");
    } finally {
      setTranscriptionNote(null);
    }
  }

  return (
    <Card className="border-slate-200 bg-white/95">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Active prompt</p>
            <CardTitle className="text-xl text-slate-900">
              {question ? `Question ${question.sequence}` : "Select a question"}
            </CardTitle>
          </div>
          <Badge className="rounded-full bg-cyan-50 px-4 py-1 text-cyan-700" variant="secondary">
            {recorder.isRecording ? "Recording" : "Recorder ready"}
          </Badge>
        </div>
        <p className="text-sm text-slate-600">
          {question?.prompt ?? "Choose a prompt from the left rail to begin recording your response."}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              className="rounded-full"
              variant={recorder.isRecording ? "destructive" : "default"}
              onClick={recorder.isRecording ? recorder.stopRecording : recorder.startRecording}
              disabled={!question}
            >
              {recorder.isRecording ? (
                <>
                  <PauseCircle className="mr-2 h-5 w-5" /> Stop & save
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" /> Start recording
                </>
              )}
            </Button>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <PlayCircle className="h-5 w-5 text-slate-500" />
              {timer}
            </div>
            {recorder.error && (
              <span className="inline-flex items-center gap-1 text-sm text-rose-600">
                <AlertCircle className="h-4 w-4" /> {recorder.error}
              </span>
            )}
            {transcriptionNote && !recorder.isRecording && (
              <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {transcriptionNote}
              </span>
            )}
          </div>
          {recorder.playbackUrl && (
            <div className="mt-4 space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Preview</p>
              <audio controls src={recorder.playbackUrl} className="w-full" />
              <div className="flex flex-wrap gap-2 text-sm text-slate-600">
                <Button variant="ghost" size="sm" className="gap-2 text-slate-600" onClick={recorder.reset}>
                  <RefreshCcw className="h-4 w-4" /> Retake
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Transcript draft</p>
            <span className="text-xs text-slate-400">Auto transcription coming next</span>
          </div>
          <Textarea
            value={transcriptDraft}
            onChange={(event) => setTranscriptDraft(event.target.value)}
            placeholder="Your spoken response will appear here once transcribed. You can also type notes manually."
            className="min-h-[140px]"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">AI feedback notes</p>
            <span className="text-xs text-slate-400">We'll pipe in AI coaching soon</span>
          </div>
          <Textarea
            value={aiFeedbackDraft}
            onChange={(event) => setAiFeedbackDraft(event.target.value)}
            placeholder="Paste or jot down the AI critique you receive."
            className="min-h-[120px]"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700">Self score for this prompt</p>
            <span className="text-xs text-slate-400">1 = Needs work · 5 = Confident</span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={sliderValue}
            onChange={(event) => setSelfScore(Number(event.target.value))}
            className="w-full"
            disabled={!question}
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>1</span>
            <span>3</span>
            <span>5</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handleSubmitResponse}
            disabled={!question || recordResponse.isPending}
          >
            {recordResponse.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving response
              </>
            ) : (
              "Save response & feedback"
            )}
          </Button>
          {submissionError && <p className="text-sm text-rose-600">{submissionError}</p>}
          {submissionSuccess && <p className="text-sm text-emerald-600">{submissionSuccess}</p>}
        </div>

        {question && question.responses.length > 0 && (
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Previous takes</p>
            <div className="space-y-3">
              {[...question.responses]
                .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                .map((response) => (
                  <div key={response.id} className="rounded-xl border border-slate-200 bg-white/80 p-3 text-sm">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{new Date(response.submittedAt).toLocaleString()}</span>
                      {typeof response.score === "number" && (
                        <span className="font-semibold text-amber-600">Score · {response.score}/5</span>
                      )}
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-slate-700">{response.transcript}</p>
                    {response.aiFeedback && (
                      <p className="mt-2 rounded-lg bg-indigo-50/80 px-3 py-2 text-xs text-indigo-700">
                        {response.aiFeedback}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SessionReflection({ session }: { session: InterviewSession }) {
  const updateSession = useUpdateInterviewSession(session.id);
  const [ratingDraft, setRatingDraft] = useState<number | null>(session.rating ?? null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const ratingOptions = [1, 2, 3, 4, 5];

  useEffect(() => {
    setRatingDraft(session.rating ?? null);
  }, [session.rating]);

  async function handleSaveRating() {
    setStatusMessage(null);
    try {
      await updateSession.mutateAsync({ rating: ratingDraft });
      setStatusMessage("Rating saved");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Unable to save rating");
    }
  }

  return (
    <Card className="border-slate-200 bg-white/95">
      <CardHeader className="space-y-2">
        <CardTitle className="text-base text-slate-700">Feedback & wrap-up</CardTitle>
        <p className="text-sm text-slate-500">
          Review AI notes, capture your reflections, and lock in a rating once you’re satisfied.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">AI summary</p>
            <p className="mt-2 text-sm text-slate-700">
              {session.summary ?? "AI summary will appear here after your responses are analyzed."}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Next moves</p>
            <p className="mt-2 text-sm text-slate-700">
              {session.recommendation ?? "You’ll get tailored recommendations on what to sharpen once AI feedback runs."}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Rate this run</p>
          <div className="flex flex-wrap gap-2">
            {ratingOptions.map((value) => (
              <Button
                key={value}
                type="button"
                variant={ratingDraft === value ? "default" : "outline"}
                className={cn("w-12", ratingDraft === value ? "border-indigo-500" : "border-slate-200")}
                onClick={() => setRatingDraft(value)}
              >
                {value}
              </Button>
            ))}
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={handleSaveRating}
            disabled={updateSession.isPending}
          >
            {updateSession.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving rating
              </>
            ) : (
              "Save rating"
            )}
          </Button>
          {statusMessage && (
            <p className={cn("text-sm", statusMessage.includes("saved") ? "text-emerald-600" : "text-rose-600")}>{
              statusMessage
            }</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}
