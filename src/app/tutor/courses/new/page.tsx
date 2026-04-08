"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CourseApprovalStatus, CourseLevel, LessonFormat, ResourceType } from "@prisma/client";
import { ArrowLeft, CheckCircle2, Circle, Layers3, Plus, Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { slugify } from "@/lib/slugify";
import { TutorExamBuilder, ExamConfig } from "@/components/tutor/exam-builder";
import { isVideoUrlValid, toEmbedUrl, isCloudinaryVideoUrl, isIframeVideoHost } from "@/lib/video";

type SectionModule = {
  id: string;
  title: string;
  durationMinutes: number;
  format: LessonFormat;
  summary?: string;
  videoUrl?: string;
  resources: {
    id: string;
    title: string;
    type: ResourceType;
    url: string;
  }[];
};

type ResourceDraft = {
  title: string;
  type: ResourceType;
  url: string;
};

type SectionState = {
  id: string;
  title: string;
  modules: SectionModule[];
  draft: {
    title: string;
    duration: string;
    format: LessonFormat;
    summary: string;
  };
  examEnabled: boolean;
  exam: ExamConfig;
};

type SectionUpdater = (_section: SectionState) => SectionState;

const STORAGE_KEY = "tutor-course-draft-v1";

const WIZARD_STEPS = [
  { id: "basics", label: "Basics" },
  { id: "sections", label: "Sections" },
  { id: "assessments", label: "Assessments" },
  { id: "review", label: "Review" },
];

// Temporary navigation stub used during migration/type-fix work.
// Replace with the real step navigation logic in cleanup pass.
const navigateStep = (i: any) => {};

const SECTION_TEMPLATES: { label: string; description: string; modules: Omit<SectionModule, "id">[] }[] = [
  {
    label: "Video + recap",
    description: "Single video plus short summary task",
    modules: [
      { title: "Watch: Core concept", durationMinutes: 18, format: "VIDEO", summary: "Primary lecture content", resources: [] },
      { title: "Recap worksheet", durationMinutes: 10, format: "TEXT", summary: "Short written recap", resources: [] },
    ],
  },
  {
    label: "Workshop sprint",
    description: "Live session followed by async assignment",
    modules: [
      { title: "Live workshop", durationMinutes: 45, format: "LIVE", summary: "Instructor-led session", resources: [] },
      { title: "Project upload", durationMinutes: 30, format: "TEXT", summary: "Learner submits assignment", resources: [] },
    ],
  },
];

const LESSON_FORMATS: LessonFormat[] = ["VIDEO", "TEXT", "LIVE"];
const LEVELS: CourseLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

const INITIAL_BASICS = {
  title: "",
  tagline: "",
  description: "",
  category: "",
  level: "BEGINNER" as CourseLevel,
  coverImage: "",
};

type CourseDraftPersistence = {
  basics: typeof INITIAL_BASICS;
  outcomesInput: string;
  skillsInput: string;
  sections: SectionState[];
  resourceDrafts: Record<string, ResourceDraft>;
  finalExamEnabled: boolean;
  finalExam: ExamConfig;
  coverPreview: string;
  coverName: string | null;
  currentStep: number;
};

type CourseBuilderProps = {
  draftEndpoint?: string;
  coursesEndpoint?: string;
  backHref?: string;
  backLabel?: string;
  requiresReview?: boolean;
  isModalMode?: boolean;
  onCourseCreated?: () => void;
};

type TutorCourseSummary = {
  id: string;
  approvalStatus: CourseApprovalStatus;
  tutorEditingLocked: boolean;
  draftStructure?: CourseDraftPersistence | null;
  title?: string | null;
  tagline?: string | null;
  description?: string | null;
  category?: string | null;
  level?: CourseLevel | null;
  coverImage?: string | null;
};

type ExtendedCourseApprovalStatus = CourseApprovalStatus | "DRAFT";

const STATUS_LABELS: Record<ExtendedCourseApprovalStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending review",
  APPROVED: "Approved",
  CHANGES: "Needs updates",
};

const STATUS_STYLES: Record<ExtendedCourseApprovalStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700",
  PENDING: "bg-blue-50 text-blue-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  CHANGES: "bg-rose-50 text-rose-700",
};

const defaultExamConfig = (label: string): ExamConfig => ({
  title: label,
  description: "",
  passingScore: 70,
  timeLimit: 45,
  modules: [],
});

const normalizeVideoUrlForSave = (url?: string) => {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  if (!isVideoUrlValid(trimmed)) return undefined;
  if (isIframeVideoHost(trimmed)) {
    return toEmbedUrl(trimmed);
  }
  return toEmbedUrl(trimmed);
};

const createSectionDraft = (): SectionState["draft"] => ({
  title: "",
  duration: "15",
  format: "VIDEO",
  summary: "",
});

const createResourceDraft = (): ResourceDraft => ({
  title: "",
  type: ResourceType.PDF,
  url: "",
});

const ensureResourceDraft = (draft?: ResourceDraft): ResourceDraft => draft ?? createResourceDraft();

const createSection = (index: number): SectionState => ({
  id: crypto.randomUUID(),
  title: `Section ${index}`,
  modules: [],
  draft: createSectionDraft(),
  examEnabled: false,
  exam: defaultExamConfig(`Section ${index} quiz`),
});

export function TutorCourseBuilder({
  draftEndpoint = "/api/tutor/courses/draft",
  coursesEndpoint = "/api/tutor/courses",
  backHref = "/tutor",
  backLabel = "Back to tutor dashboard",
  requiresReview = true,
  isModalMode = false,
  onCourseCreated,
}: CourseBuilderProps = {}) {
  const [basics, setBasics] = useState(INITIAL_BASICS);
  const [outcomesInput, setOutcomesInput] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [sections, setSections] = useState<SectionState[]>([createSection(1)]);
  const [finalExamEnabled, setFinalExamEnabled] = useState(false);
  const [finalExam, setFinalExam] = useState<ExamConfig>(defaultExamConfig("Final exam"));
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [coverName, setCoverName] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [resourceDrafts, setResourceDrafts] = useState<Record<string, ResourceDraft>>({});
  const [uploadingResourceFor, setUploadingResourceFor] = useState<string | null>(null);
  const [courseMeta, setCourseMeta] = useState<TutorCourseSummary | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);

  const hydrateFromDraft = useCallback((draft: CourseDraftPersistence) => {
    setBasics({ ...INITIAL_BASICS, ...draft.basics });
    setOutcomesInput(draft.outcomesInput ?? "");
    setSkillsInput(draft.skillsInput ?? "");
    setSections(draft.sections?.length ? draft.sections : [createSection(1)]);
    setResourceDrafts(draft.resourceDrafts ?? {});
    setFinalExamEnabled(Boolean(draft.finalExamEnabled));
    setFinalExam(draft.finalExam ?? defaultExamConfig("Final exam"));
    setCoverPreview(draft.coverPreview ?? "");
    setCoverName(draft.coverName ?? null);
    setCurrentStep(typeof draft.currentStep === "number" ? draft.currentStep : 0);
  }, []);

  const hydrateFromSummary = useCallback((summary: TutorCourseSummary) => {
    setBasics((prev) => ({
      ...prev,
      title: summary.title ?? prev.title,
      tagline: summary.tagline ?? prev.tagline,
      description: summary.description ?? prev.description,
      category: summary.category ?? prev.category,
      level: summary.level ?? prev.level,
      coverImage: summary.coverImage ?? prev.coverImage ?? "",
    }));
    if (summary.coverImage) {
      setCoverPreview(summary.coverImage);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      hydrateFromDraft({
        basics: parsed.basics ?? INITIAL_BASICS,
        outcomesInput: parsed.outcomesInput ?? "",
        skillsInput: parsed.skillsInput ?? "",
        sections: parsed.sections?.length ? parsed.sections : [createSection(1)],
        resourceDrafts: parsed.resourceDrafts ?? {},
        finalExamEnabled: Boolean(parsed.finalExamEnabled),
        finalExam: parsed.finalExam ?? defaultExamConfig("Final exam"),
        coverPreview: parsed.coverPreview ?? "",
        coverName: parsed.coverName ?? null,
        currentStep: typeof parsed.currentStep === "number" ? parsed.currentStep : 0,
      });
    } catch (err) {
      console.warn("Failed to load tutor course draft", err);
    }
  }, [hydrateFromDraft]);

  useEffect(() => {
    let mounted = true;
    async function fetchDraft() {
      try {
        // Check if we should force a fresh start (new course creation)
        const urlParams = new URLSearchParams(window.location.search);
        const forceNew = urlParams.get('new') === 'true';
        
        // Force fresh start if either URL parameter says new OR we're in modal mode
        if (forceNew || isModalMode) {
          // Clear any existing draft data for fresh start
          window.localStorage.removeItem(STORAGE_KEY);
          setLoadingDraft(false);
          return;
        }

        const res = await fetch(draftEndpoint, { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to fetch draft");
        }
        const data = (await res.json()) as { course?: TutorCourseSummary | null };
        if (!mounted) return;
        
        // Only load draft data if we're not forcing a new course
        if (data.course && !forceNew && !isModalMode) {
          setCourseMeta(data.course);
          setCourseId(data.course.id);
          if (data.course.draftStructure) {
            hydrateFromDraft(data.course.draftStructure as CourseDraftPersistence);
          } else {
            hydrateFromSummary(data.course);
          }
        }
      } catch (err) {
        console.warn("Tutor draft fetch failed", err);
      } finally {
        if (mounted) setLoadingDraft(false);
      }
    }
    fetchDraft();
    return () => {
      mounted = false;
    };
  }, [draftEndpoint, hydrateFromDraft, hydrateFromSummary, isModalMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const payload = {
      basics,
      outcomesInput,
      skillsInput,
      sections,
      resourceDrafts,
      finalExamEnabled,
      finalExam,
      coverPreview,
      coverName,
      currentStep,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [basics, outcomesInput, skillsInput, sections, resourceDrafts, finalExamEnabled, finalExam, coverPreview, coverName, currentStep]);

  const outcomes = useMemo(
    () =>
      outcomesInput
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    [outcomesInput],
  );

  const skills = useMemo(
    () =>
      skillsInput
        .split(/\n|,/)
        .map((item) => item.trim())
        .filter(Boolean),
    [skillsInput],
  );

  const derivedSlug = useMemo(() => slugify(basics.title || ""), [basics.title]);

  const basicsComplete =
    basics.title.trim().length > 0 &&
    basics.tagline.trim().length > 0 &&
    basics.description.trim().length > 0 &&
    basics.category.trim().length > 0 &&
    Boolean(coverPreview);

  const sectionsComplete = sections.every((section) => section.title.trim().length > 0 && section.modules.length > 0);

  const assessmentsComplete =
    sections.every((section) => !section.examEnabled || section.exam.modules.length > 0) &&
    (!finalExamEnabled || finalExam.modules.length > 0);

  const reviewReady = basicsComplete && sectionsComplete && assessmentsComplete;

  const stepValidity = [basicsComplete, sectionsComplete, assessmentsComplete, reviewReady];
  const progressValue = Math.round((stepValidity.filter(Boolean).length / WIZARD_STEPS.length) * 100);

  const canSubmit = reviewReady;
  const editingLocked = courseMeta?.tutorEditingLocked ?? false;
  const approvalStatus = (courseMeta?.approvalStatus ?? "DRAFT") as ExtendedCourseApprovalStatus;
  const statusBadgeClass = STATUS_STYLES[approvalStatus];
  const isPendingReview = approvalStatus === "PENDING";
  const changesRequested = approvalStatus === "CHANGES";

  const buildDraftSnapshot = useCallback((): CourseDraftPersistence => ({
    basics,
    outcomesInput,
    skillsInput,
    sections,
    resourceDrafts,
    finalExamEnabled,
    finalExam,
    coverPreview,
    coverName,
    currentStep,
  }), [
    basics,
    outcomesInput,
    skillsInput,
    sections,
    resourceDrafts,
    finalExamEnabled,
    finalExam,
    coverPreview,
    coverName,
    currentStep,
  ]);

  const upsertDraft = useCallback(
    async (opts: { submit?: boolean } = {}): Promise<TutorCourseSummary | null> => {
      if (savingDraft || submitting) return null;
      setSavingDraft(true);
      setError(null);

      try {
        const payload = {
          courseId: courseId ?? undefined,
          coverImage: basics.coverImage || coverPreview || "https://placehold.co/1200x600",
          title: basics.title.trim(),
          slug: derivedSlug,
          tagline: basics.tagline.trim(),
          description: basics.description.trim(),
          category: basics.category.trim(),
          level: basics.level,
          outcomes,
          skills,
          sections: sections.map((section, index) => ({
            title: section.title.trim(),
            order: index + 1,
            modules: section.modules.map((module) => {
              const normalizedVideoUrl = module.format === "VIDEO" ? normalizeVideoUrlForSave(module.videoUrl) : undefined;
              return {
                title: module.title,
                format: module.format,
                durationMinutes: module.durationMinutes,
                summary: module.summary ?? "",
                videoUrl: normalizedVideoUrl,
                resources:
                  module.resources?.map((resource) => ({
                    title: resource.title,
                    type: resource.type,
                    url: resource.url,
                  })) ?? [],
              };
            }),
            exam:
              section.examEnabled && section.exam.modules.length
                ? {
                    title: section.exam.title,
                    description: section.exam.description,
                    passingScore: section.exam.passingScore,
                    timeLimit: section.exam.timeLimit,
                    modules: section.exam.modules,
                  }
                : undefined,
          })),
          finalExam:
            finalExamEnabled && finalExam.modules.length
              ? {
                  title: finalExam.title,
                  description: finalExam.description,
                  passingScore: finalExam.passingScore,
                  timeLimit: finalExam.timeLimit,
                  modules: finalExam.modules,
                }
              : undefined,
          draftStructure: buildDraftSnapshot(),
        };

        console.log("Creating/updating course with payload:", { 
          courseId: payload.courseId, 
          title: payload.title, 
          slug: payload.slug,
          submit: opts.submit 
        });

        const res = await fetch(coursesEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        console.log("Course creation response status:", res.status);

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          console.error("Course creation failed:", data);
          throw new Error(data.error || "Failed to save draft");
        }

        const data = (await res.json()) as { course: TutorCourseSummary };
        console.log("Course created successfully:", { id: data.course.id, title: data.course.title });
        
        setCourseMeta(data.course);
        setCourseId(data.course.id);
        if (!opts.submit) {
          setSuccess("Draft saved");
          setTimeout(() => setSuccess(null), 2000);
        }
        return data.course;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to save draft";
        setError(message);
        return null;
      } finally {
        setSavingDraft(false);
      }
    },
    [
      savingDraft,
      submitting,
      courseId,
      basics,
      coverPreview,
      derivedSlug,
      outcomes,
      skills,
      sections,
      finalExamEnabled,
      finalExam,
      buildDraftSnapshot,
      coursesEndpoint,
    ],
  );

  const handleSubmitDraft = useCallback(async () => {
    if (!canSubmit || submitting || !courseId || editingLocked) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const course = await upsertDraft({ submit: true });
      const idToSubmit = course?.id ?? courseId;

      if (!idToSubmit) {
        throw new Error("Unable to determine course to submit");
      }

      const res = await fetch(`${coursesEndpoint}/${idToSubmit}/submit`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit course");
      }

      const data = (await res.json()) as { course: TutorCourseSummary };
      setCourseMeta(data.course);
      setCourseId(data.course.id);
      setSuccess(requiresReview ? "Course submitted for review" : "Course published");
      
      // Call the callback if in modal mode
      if (isModalMode && onCourseCreated) {
        onCourseCreated();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit course";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, submitting, courseId, coursesEndpoint, editingLocked, requiresReview, upsertDraft, isModalMode, onCourseCreated]);

  const nextStep = () => {
    if (currentStep === WIZARD_STEPS.length - 1) return;
    if (!stepValidity[currentStep]) return;
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const updateSection = (sectionId: string, updater: SectionUpdater) => {
    setSections((prev) => prev.map((section) => (section.id === sectionId ? updater(section) : section)));
  };

  const addSection = () => {
    setSections((prev) => [...prev, createSection(prev.length + 1)]);
  };

  const removeSection = (sectionId: string) => {
    if (sections.length === 1) return;
    setSections((prev) => prev.filter((section) => section.id !== sectionId));
  };

  const addModuleToSection = (sectionId: string) => {
    const moduleId = crypto.randomUUID();
    updateSection(sectionId, (section) => {
      if (!section.draft.title.trim()) return section;
      const moduleEntry: SectionModule = {
        id: moduleId,
        title: section.draft.title.trim(),
        durationMinutes: Number(section.draft.duration) || 0,
        format: section.draft.format,
        summary: section.draft.summary,
        videoUrl: section.draft.format === "VIDEO" ? "" : undefined,
        resources: [],
      };
      return {
        ...section,
        modules: [...section.modules, moduleEntry],
        draft: createSectionDraft(),
      };
    });
    setResourceDrafts((prev) => ({
      ...prev,
      [moduleId]: createResourceDraft(),
    }));
  };

  const removeModuleFromSection = (sectionId: string, moduleId: string) => {
    updateSection(sectionId, (section) => ({
      ...section,
      modules: section.modules.filter((module) => module.id !== moduleId),
    }));
  };

  const applyTemplateToSection = (sectionId: string, templateIndex: number) => {
    const template = SECTION_TEMPLATES[templateIndex];
    if (!template) return;
    const newModules = template.modules.map((module) => ({
      ...module,
      id: crypto.randomUUID(),
      videoUrl: module.format === "VIDEO" ? "" : undefined,
      resources: module.resources ?? [],
    }));
    updateSection(sectionId, (section) => ({
      ...section,
      modules: newModules,
    }));
    setResourceDrafts((prev) => {
      const next = { ...prev };
      newModules.forEach((m) => {
        next[m.id] = ensureResourceDraft(next[m.id]);
      });
      return next;
    });
  };

  const addResourceToModule = (sectionId: string, moduleId: string) => {
    const draft = resourceDrafts[moduleId];
    if (!draft?.title || !draft.url) return;
    updateSection(sectionId, (section) => ({
      ...section,
      modules: section.modules.map((mod) =>
        mod.id === moduleId
          ? {
              ...mod,
              resources: [...(mod.resources || []), { id: crypto.randomUUID(), title: draft.title, type: draft.type, url: draft.url }],
            }
          : mod,
      ),
    }));
    setResourceDrafts((prev) => ({
      ...prev,
      [moduleId]: { title: "", type: ResourceType.PDF, url: "" },
    }));
  };

  const removeResourceFromModule = (sectionId: string, moduleId: string, resourceId: string) => {
    updateSection(sectionId, (section) => ({
      ...section,
      modules: section.modules.map((mod) =>
        mod.id === moduleId ? { ...mod, resources: mod.resources.filter((r) => r.id !== resourceId) } : mod,
      ),
    }));
  };

  const handleResourceUpload = async (sectionId: string, moduleId: string, file: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Max 10MB.");
      return;
    }
    setUploadingResourceFor(moduleId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads/lesson", { method: "POST", body: formData });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = (await res.json()) as { url?: string; name?: string };
      if (!data.url) throw new Error("Upload did not return URL");
      const uploadedUrl = data.url as string;
      const uploadedTitle = data.name || file.name;

      updateSection(sectionId, (section) => ({
        ...section,
        modules: section.modules.map((mod) =>
          mod.id === moduleId
            ? {
                ...mod,
                resources: [
                  ...(mod.resources || []),
                  {
                    id: crypto.randomUUID(),
                    title: uploadedTitle,
                    type: ensureResourceDraft(resourceDrafts[moduleId]).type,
                    url: uploadedUrl,
                  },
                ],
              }
            : mod,
        ),
      }));

      setResourceDrafts((prev) => {
        const current = ensureResourceDraft(prev[moduleId]);
        return {
          ...prev,
          [moduleId]: {
            ...current,
            title: "",
            url: "",
          },
        };
      });
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Failed to upload resource";
      setError(message);
    } finally {
      setUploadingResourceFor(null);
    }
  };

  const [, setUploadingCover] = useState(false);

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCoverPreview("");
      setCoverName(null);
      return;
    }
    // show immediate preview while upload happens
    setCoverPreview(URL.createObjectURL(file));
    setUploadingCover(true);
    setCoverName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads/cover", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }
      const data = (await res.json()) as { url?: string };
      if (!data.url) {
        throw new Error("Upload did not return a URL");
      }
      setCoverPreview(data.url);
      setBasics((prev) => ({ ...prev, coverImage: data.url }));
    } catch (error) {
      console.error(error);
      // fallback to base64 preview to avoid blocking UX
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview((reader.result as string) ?? "");
        setBasics((prev) => ({ ...prev, coverImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingCover(false);
    }
  };

  const progressChecks = [
    { label: "Basics", complete: basicsComplete },
    { label: "Sections", complete: sectionsComplete },
    { label: "Assessments", complete: assessmentsComplete },
    { label: "Review", complete: reviewReady },
  ];

  const renderBasics = () => (
    <Card className="border border-slate-200/70 bg-white/95">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Course details</CardTitle>
        <CardDescription>Basics that appear on student landing pages.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              Course title <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={basics.title}
              onChange={(e) => setBasics((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Advanced SQL Bootcamp"
            />
          </div>
          <div className="space-y-1">
            <Label>Slug (auto-generated)</Label>
            <Input value={derivedSlug || "auto-generated"} readOnly disabled />
            <p className="text-xs text-slate-500">Preview: /courses/{derivedSlug || "slug"}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              Tagline <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={basics.tagline}
              onChange={(e) => setBasics((prev) => ({ ...prev, tagline: e.target.value }))}
              placeholder="One-line promise"
            />
          </div>
          <div className="space-y-1">
            <Label className="flex items-center gap-1">
              Category <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={basics.category}
              onChange={(e) => setBasics((prev) => ({ ...prev, category: e.target.value }))}
              placeholder="e.g., Data science"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="cover-upload" className="flex items-center gap-1">
              Cover image <span className="text-rose-500">*</span>
            </Label>
            <Input id="cover-upload" aria-label="Cover image" type="file" accept="image/*" onChange={handleCoverUpload} />
            {coverName ? <p className="text-xs text-slate-500">Selected: {coverName}</p> : null}
            {coverPreview ? (
              <div className="relative mt-2 h-32 w-full overflow-hidden rounded-lg">
                <Image src={coverPreview} alt="Course cover preview" fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />
              </div>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label>Level</Label>
            <select
              value={basics.level}
              onChange={(e) => setBasics((prev) => ({ ...prev, level: e.target.value as CourseLevel }))}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="flex items-center gap-1">
            Description <span className="text-rose-500">*</span>
          </Label>
          <Textarea
            value={basics.description}
            onChange={(e) => setBasics((prev) => ({ ...prev, description: e.target.value }))}
            rows={4}
            placeholder="Detail what learners will accomplish."
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label>Learning outcomes (comma or newline separated)</Label>
            <Textarea
              value={outcomesInput}
              onChange={(e) => setOutcomesInput(e.target.value)}
              rows={3}
              placeholder="Build production-grade SQL queries&#10;Optimize analytical workloads"
            />
          </div>
          <div className="space-y-1">
            <Label>Key skills (comma or newline separated)</Label>
            <Textarea
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              rows={3}
              placeholder="PostgreSQL, Query optimization, Window functions"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderSections = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Sections & modules</h2>
          <p className="text-sm text-slate-600">Break down your course into digestible segments.</p>
        </div>
        <Button type="button" variant="outline" onClick={addSection}>
          <Plus className="mr-2 h-4 w-4" />
          Add section
        </Button>
      </div>
      {sections.map((section, index) => (
        <Card key={section.id} className="border border-slate-200/70 bg-white/95">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Layers3 className="h-5 w-5 text-slate-500" />
                Section {index + 1}
              </CardTitle>
              <CardDescription>Define learning modules and optionally gate with an exam.</CardDescription>
            </div>
            {sections.length > 1 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeSection(section.id)}>
                <Trash className="mr-1 h-4 w-4" />
                Remove
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Section title</Label>
              <Input
                value={section.title}
                onChange={(e) =>
                  updateSection(section.id, (prev) => ({
                    ...prev,
                    title: e.target.value,
                    exam: { ...prev.exam, title: prev.exam.title || `${e.target.value} quiz` },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Add module</Label>
                <div className="flex gap-2 text-xs text-slate-500">
                  {SECTION_TEMPLATES.map((tpl, tplIdx) => (
                    <Button
                      key={tpl.label}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-[11px]"
                      onClick={() => applyTemplateToSection(section.id, tplIdx)}
                    >
                      {tpl.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_120px]">
                <Input
                  value={section.draft.title}
                  onChange={(e) =>
                    updateSection(section.id, (prev) => ({ ...prev, draft: { ...prev.draft, title: e.target.value } }))
                  }
                  placeholder="Lesson title"
                />
                <Input
                  type="number"
                  min={0}
                  value={section.draft.duration}
                  onChange={(e) =>
                    updateSection(section.id, (prev) => ({ ...prev, draft: { ...prev.draft, duration: e.target.value } }))
                  }
                  placeholder="Duration (min)"
                />
                <select
                  value={section.draft.format}
                  onChange={(e) =>
                    updateSection(section.id, (prev) => ({
                      ...prev,
                      draft: { ...prev.draft, format: e.target.value as LessonFormat },
                    }))
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                >
                  {LESSON_FORMATS.map((format) => (
                    <option key={format} value={format}>
                      {format.toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={section.draft.summary}
                  onChange={(e) =>
                    updateSection(section.id, (prev) => ({ ...prev, draft: { ...prev.draft, summary: e.target.value } }))
                  }
                  placeholder="Optional summary"
                  className="flex-1"
                />
                <Button
                  type="button"
                  aria-label="Add module"
                  disabled={!section.draft.title.trim()}
                  onClick={() => addModuleToSection(section.id)}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {section.modules.length === 0 ? (
              <p className="rounded border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">No modules yet.</p>
            ) : (
              <div className="space-y-2">
                {section.modules.map((module) => (
                  <div key={module.id} className="rounded border border-slate-100 bg-white px-3 py-3 text-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{module.title}</p>
                        <p className="text-xs text-slate-500">
                          {module.format.toLowerCase()} · {module.durationMinutes} min
                        </p>
                        {module.summary ? <p className="text-xs text-slate-500 mt-1">{module.summary}</p> : null}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeModuleFromSection(section.id, module.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>

                    {module.format === "VIDEO" ? (
                      <div className="space-y-2 rounded-lg border border-blue-100/70 bg-blue-50/50 p-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-xs font-semibold text-slate-700">Lesson video</p>
                          <p className="text-[11px] text-slate-500">Paste a YouTube/Vimeo embed link only.</p>
                        </div>
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <Input
                            value={module.videoUrl ?? ""}
                            onChange={(e) =>
                              updateSection(section.id, (prev) => ({
                                ...prev,
                                modules: prev.modules.map((m) =>
                                  m.id === module.id ? { ...m, videoUrl: e.target.value } : m,
                                ),
                              }))
                            }
                            placeholder="https://youtu.be/... or https://vimeo.com/..."
                            className={`${module.videoUrl && !isVideoUrlValid(module.videoUrl) ? "border-amber-400 bg-amber-50/60" : ""}`}
                          />
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateSection(section.id, (prev) => ({
                                  ...prev,
                                  modules: prev.modules.map((m) =>
                                    m.id === module.id
                                      ? { ...m, videoUrl: toEmbedUrl(m.videoUrl ?? "") }
                                      : m,
                                  ),
                                }))
                              }
                              disabled={!module.videoUrl?.trim() || !isVideoUrlValid(module.videoUrl)}
                            >
                              Preview
                            </Button>
                          </div>
                        </div>
                        {module.videoUrl?.trim() ? (
                          isVideoUrlValid(module.videoUrl) ? (
                            <div className="mx-auto w-full max-w-xl">
                              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-950/70 p-2 shadow-sm">
                                <div className="aspect-video overflow-hidden rounded-lg">
                                  {isCloudinaryVideoUrl(module.videoUrl) ? (
                                    <video
                                      src={module.videoUrl}
                                      controls
                                      preload="metadata"
                                      playsInline
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <iframe
                                      src={toEmbedUrl(module.videoUrl)}
                                      title={`${module.title} video`}
                                      className="h-full w-full"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-amber-600">
                              Enter an approved YouTube, Vimeo, or uploaded video link.
                            </p>
                          )
                        ) : (
                          <p className="text-[11px] text-slate-500">Add an embed link to show preview.</p>
                        )}
                      </div>
                    ) : null}

                    <div className="rounded-lg border border-slate-200/70 bg-slate-50/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-700">Resources</p>
                        <p className="text-[11px] text-slate-500">
                          {module.resources?.length ?? 0} attached
                        </p>
                      </div>

                      <div className="grid gap-2 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.4fr)_120px] items-center">
                        <Input
                          value={resourceDrafts[module.id]?.title ?? ""}
                          onChange={(e) =>
                            setResourceDrafts((prev) => ({
                              ...prev,
                              [module.id]: { ...(prev[module.id] ?? { type: ResourceType.PDF, url: "" }), title: e.target.value },
                            }))
                          }
                          placeholder="Resource title"
                        />
                        <select
                          value={resourceDrafts[module.id]?.type ?? ResourceType.PDF}
                          onChange={(e) =>
                            setResourceDrafts((prev) => ({
                              ...prev,
                              [module.id]: {
                                ...(prev[module.id] ?? { title: "", url: "" }),
                                type: e.target.value as ResourceType,
                              },
                            }))
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
                        >
                          <option value={ResourceType.PDF}>PDF</option>
                          <option value={ResourceType.SLIDE}>SLIDE</option>
                          <option value={ResourceType.LINK}>LINK</option>
                        </select>
                        <Input
                          value={resourceDrafts[module.id]?.url ?? ""}
                          onChange={(e) =>
                            setResourceDrafts((prev) => ({
                              ...prev,
                              [module.id]: { ...(prev[module.id] ?? { title: "", type: ResourceType.PDF }), url: e.target.value },
                            }))
                          }
                          placeholder="https://..."
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = ".pdf,.ppt,.pptx,.doc,.docx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                              input.onchange = (ev) => {
                                const target = ev.target as HTMLInputElement;
                                const file = target.files?.[0];
                                if (file) handleResourceUpload(section.id, module.id, file);
                              };
                              input.click();
                            }}
                            disabled={uploadingResourceFor === module.id}
                          >
                            {uploadingResourceFor === module.id ? "Uploading..." : "Upload file"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => addResourceToModule(section.id, module.id)}
                            disabled={!resourceDrafts[module.id]?.title || !resourceDrafts[module.id]?.url}
                          >
                            Add
                          </Button>
                        </div>
                      </div>

                      {module.resources?.length ? (
                        <div className="space-y-2">
                          {module.resources.map((res) => (
                            <div key={res.id} className="flex items-center justify-between rounded border border-slate-200 bg-white px-2 py-2 text-xs">
                              <div className="space-y-0.5">
                                <p className="font-medium text-slate-800">{res.title}</p>
                                <p className="text-[11px] text-slate-500">{res.type}</p>
                                <a href={res.url} target="_blank" className="text-primary hover:underline">
                                  Open
                                </a>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeResourceFromModule(section.id, module.id, res.id)}
                              >
                                <Trash className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">No resources yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2 rounded-xl border border-slate-200/70 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Section exam</h3>
                  <p className="text-xs text-slate-500">Optional assessment before moving to the next section.</p>
                </div>
                <Button
                  type="button"
                  variant={section.examEnabled ? "default" : "outline"}
                  onClick={() =>
                    updateSection(section.id, (prev) => ({
                      ...prev,
                      examEnabled: !prev.examEnabled,
                      exam: prev.exam.modules.length ? prev.exam : defaultExamConfig(`${prev.title} quiz`),
                    }))
                  }
                >
                  {section.examEnabled ? "Enabled" : "Enable"}
                </Button>
              </div>
              {section.examEnabled ? (
                <TutorExamBuilder
                  value={section.exam}
                  onChange={(config) =>
                    updateSection(section.id, (prev) => ({
                      ...prev,
                      exam: config,
                    }))
                  }
                  title="Section exam"
                />
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderAssessments = () => (
    <Card className="border border-slate-200/70 bg-white/95">
      <CardHeader className="flex items-center justify-between gap-3">
        <div>
          <CardTitle className="text-lg font-semibold text-slate-900">Final exam (optional)</CardTitle>
          <CardDescription>Require a capstone exam before issuing completion.</CardDescription>
        </div>
        <Button type="button" variant={finalExamEnabled ? "default" : "outline"} onClick={() => setFinalExamEnabled((prev) => !prev)}>
          {finalExamEnabled ? "Enabled" : "Enable"}
        </Button>
      </CardHeader>
      <CardContent>{finalExamEnabled ? <TutorExamBuilder value={finalExam} onChange={setFinalExam} /> : null}</CardContent>
    </Card>
  );

  const renderReview = () => (
    <Card className="border border-slate-200/70 bg-white/95">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">
          {requiresReview ? "Review & submit" : "Review & publish"}
        </CardTitle>
        <CardDescription>
          {requiresReview ? "Confirm details before sending for admin approval." : "Confirm details before publishing this course."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-700">
        <p>
          <strong>Title:</strong> {basics.title || "–"}
        </p>
        <p>
          <strong>Tagline:</strong> {basics.tagline || "–"}
        </p>
        <p>
          <strong>Category:</strong> {basics.category || "–"} · <strong>Level:</strong> {basics.level.toLowerCase()}
        </p>
        <p>
          <strong>Sections:</strong> {sections.length} · Modules: {sections.reduce((sum, s) => sum + s.modules.length, 0)}
        </p>
        <p>
          <strong>Exams configured:</strong>{" "}
          {sections.filter((s) => s.examEnabled && s.exam.modules.length).length + (finalExamEnabled && finalExam.modules.length ? 1 : 0)}
        </p>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" asChild>
            <Link href={backHref}>Cancel</Link>
          </Button>
          <Button onClick={() => upsertDraft()} disabled={savingDraft || editingLocked} variant="secondary">
            {savingDraft ? "Saving..." : editingLocked ? "Editing locked" : "Save draft"}
          </Button>
          <Button onClick={handleSubmitDraft} disabled={!canSubmit || submitting || !courseId || editingLocked}>
            {submitting ? (requiresReview ? "Submitting..." : "Publishing...") : editingLocked ? "Locked" : requiresReview ? "Submit for review" : "Publish course"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loadingDraft) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-12">
          <p className="text-center text-slate-600">Loading your latest draft...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ArrowLeft className="h-4 w-4" />
              <Link href={backHref} className="text-slate-700 hover:text-slate-900">
                {backLabel}
              </Link>
            </div>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Create course</h1>
            <p className="text-slate-600">Set up sections, modules, and optional exams in one flow.</p>
          </div>
          <Badge variant="outline" className={statusBadgeClass}>
            {STATUS_LABELS[approvalStatus]}
          </Badge>
        </div>

        {error ? <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        {success ? (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
        ) : null}
        {editingLocked ? (
          <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {isPendingReview
              ? "This course is pending admin review. Edits are locked until a decision is made."
              : "Editing has been locked by the admin team. Contact support if you need to reopen."}
          </div>
        ) : changesRequested ? (
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Admin requested updates. Address their feedback and resubmit to continue review.
          </div>
        ) : null}

        <Card className="border border-blue-100 bg-white/95">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Progress tracker</p>
                <p className="text-3xl font-semibold text-slate-900">{progressValue}%</p>
                <p className="text-sm text-slate-500">Complete the required fields in each step before submitting.</p>
              </div>
              <div className="w-full flex-1">
                <Progress value={progressValue} className="h-2" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {progressChecks.map((step) => (
                <div key={step.label} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3">
                  {step.complete ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-slate-300" />}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                    <p className="text-xs text-slate-500">{step.complete ? "Complete" : "Needs attention"}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-4">
          {WIZARD_STEPS.map((step, idx) => {
            const isActive = idx === currentStep;
            const complete = stepValidity[idx];
            return (
              <button
                key={step.id}
                onClick={() => navigateStep(idx)}
                className={`flex items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                  isActive ? "border-blue-400 bg-blue-50" : "border-slate-200 bg-white"
                }`}
              >
                <div>
                  <p className="text-xs uppercase text-slate-500">Step {idx + 1}</p>
                  <p className="text-sm font-semibold text-slate-900">{step.label}</p>
                </div>
                {complete ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate-300" />}
              </button>
            );
          })}
        </div>

        {currentStep === 0 && (
          <fieldset disabled={editingLocked} className={`m-0 border-0 p-0 ${editingLocked ? "opacity-75" : ""}`}>
            {renderBasics()}
          </fieldset>
        )}
        {currentStep === 1 && (
          <fieldset disabled={editingLocked} className={`m-0 border-0 p-0 ${editingLocked ? "opacity-75" : ""}`}>
            {renderSections()}
          </fieldset>
        )}
        {currentStep === 2 && (
          <fieldset disabled={editingLocked} className={`m-0 border-0 p-0 ${editingLocked ? "opacity-75" : ""}`}>
            {renderAssessments()}
          </fieldset>
        )}
        {currentStep === 3 && renderReview()}

        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/95 px-4 py-4">
          <div className="text-sm text-slate-600">
            <p>
              <strong>{sections.length}</strong> sections · <strong>{sections.reduce((sum, s) => sum + s.modules.length, 0)}</strong> modules
            </p>
            <p>
              Exams configured:{" "}
              {sections.filter((s) => s.examEnabled && s.exam.modules.length).length + (finalExamEnabled && finalExam.modules.length ? 1 : 0)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
              Previous
            </Button>
            {currentStep < WIZARD_STEPS.length - 1 ? (
              <Button onClick={nextStep} disabled={!stepValidity[currentStep]}>
                Next
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => upsertDraft()} disabled={savingDraft || editingLocked}>
                  {savingDraft ? "Saving..." : editingLocked ? "Locked" : "Save draft"}
                </Button>
                <Button onClick={handleSubmitDraft} disabled={!canSubmit || submitting || !courseId || editingLocked}>
                  {submitting ? (requiresReview ? "Submitting..." : "Publishing...") : editingLocked ? "Locked" : requiresReview ? "Submit course" : "Publish course"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function TutorCourseCreatePage() {
  return <TutorCourseBuilder />;
}
