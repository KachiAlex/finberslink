import type {
  ResumeExperience,
  ResumeProject,
  ResumeVisibility,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
};

export interface ResumeTemplateProps {
  resume: {
    title: string;
    summary: string | null;
    visibility: ResumeVisibility;
    skills?: string[];
    personaName?: string | null;
    location?: string | null;
    introVideoEmbedUrl?: string | null;
    experiences: Array<
      Pick<
        ResumeExperience,
        "id" | "company" | "role" | "startDate" | "endDate" | "description" | "achievements"
      >
    >;
    projects: Array<
      Pick<ResumeProject, "id" | "name" | "summary" | "link" | "techStack">
    >;
  };
}

export function ResumeModernTemplate({ resume }: ResumeTemplateProps) {
  const experiences = resume.experiences ?? [];
  const projects = resume.projects ?? [];
  const skills = resume.skills ?? [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-slate-900">
                  {resume.title}
                </CardTitle>
                {resume.personaName && (
                  <p className="text-sm text-slate-500 mt-1">{resume.personaName}</p>
                )}
                {resume.summary ? (
                  <CardDescription className="mt-2 text-base text-slate-600">
                    {resume.summary}
                  </CardDescription>
                ) : null}
              </div>
              <Badge variant="outline" className="capitalize text-xs">
                {resume.visibility.toLowerCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {resume.introVideoEmbedUrl ? (
              <section className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                  Intro video
                </h4>
                <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200">
                  <iframe
                    title="Candidate introduction video"
                    src={resume.introVideoEmbedUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </section>
            ) : null}

            {skills.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>
            )}

            {experiences.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
                  Experience
                </h3>
                <div className="space-y-6">
                  {experiences.map((exp) => {
                    const start = formatDate(exp.startDate);
                    const end = formatDate(exp.endDate) ?? "Present";
                    const achievements = exp.achievements ?? [];
                    return (
                      <div key={exp.id} className="border-l-4 border-blue-500 pl-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-slate-900">{exp.role}</h4>
                            <p className="text-sm text-slate-600">{exp.company}</p>
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {start} – {end}
                          </span>
                        </div>
                        {exp.description ? (
                          <p className="text-sm text-slate-600 mt-2">{exp.description}</p>
                        ) : null}
                        {achievements.length > 0 && (
                          <ul className="mt-2 text-sm text-slate-600 list-disc list-inside">
                            {achievements.map((achievement, i) => (
                              <li key={`${exp.id}-achievement-${i}`}>{achievement}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {projects.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
                  Projects
                </h3>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="border-l-4 border-indigo-500 pl-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">{project.name}</h4>
                          {project.summary && (
                            <p className="text-sm text-slate-600 mt-1">{project.summary}</p>
                          )}
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline mt-1 block"
                            >
                              View project →
                            </a>
                          )}
                        </div>
                      </div>
                      {(project.techStack ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(project.techStack ?? []).map((tech) => (
                            <Badge key={`${project.id}-${tech}`} variant="secondary" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
