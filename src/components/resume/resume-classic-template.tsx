import type {
  ResumeExperience,
  ResumeProject,
} from "@prisma/client";

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
};

export interface ResumeTemplateProps {
  resume: {
    title: string;
    summary: string | null;
    skills?: string[];
    personaName?: string | null;
    location?: string | null;
    visibility?: string;
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

export function ResumeClassicTemplate({ resume }: ResumeTemplateProps) {
  const experiences = resume.experiences ?? [];
  const projects = resume.projects ?? [];
  const skills = resume.skills ?? [];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="border-b-2 border-slate-800 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-slate-900">{resume.title}</h1>
          {resume.personaName && (
            <p className="text-sm text-slate-600 mt-1">{resume.personaName}</p>
          )}
          {resume.location && (
            <p className="text-sm text-slate-600">{resume.location}</p>
          )}
        </div>

        {/* Professional Summary */}
        {resume.summary && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Professional Summary
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Skills
            </h2>
            <p className="text-sm text-slate-700">
              {skills.join(" • ")}
            </p>
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Professional Experience
            </h2>
            <div className="space-y-4">
              {experiences.map((exp) => {
                const start = formatDate(exp.startDate);
                const end = formatDate(exp.endDate) ?? "Present";
                const achievements = exp.achievements ?? [];
                return (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-900">{exp.role}</p>
                        <p className="text-sm text-slate-700">{exp.company}</p>
                      </div>
                      <span className="text-xs text-slate-600 whitespace-nowrap ml-4">
                        {start} – {end}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-slate-700 mt-1">{exp.description}</p>
                    )}
                    {achievements.length > 0 && (
                      <ul className="mt-2 text-sm text-slate-700 list-disc list-inside">
                        {achievements.map((achievement, i) => (
                          <li key={`${exp.id}-achievement-${i}`}>{achievement}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
              Projects
            </h2>
            <div className="space-y-4">
              {projects.map((project) => (
                <div key={project.id}>
                  <p className="font-bold text-slate-900">{project.name}</p>
                  {project.summary && (
                    <p className="text-sm text-slate-700 mt-1">{project.summary}</p>
                  )}
                  {(project.techStack ?? []).length > 0 && (
                    <p className="text-sm text-slate-700 mt-1">
                      Technologies: {(project.techStack ?? []).join(", ")}
                    </p>
                  )}
                  {project.link && (
                    <p className="text-sm text-slate-700 mt-1">
                      {project.link}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
