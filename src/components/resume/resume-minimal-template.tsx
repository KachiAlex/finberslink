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

export function ResumeMinimalTemplate({ resume }: ResumeTemplateProps) {
  const experiences = resume.experiences ?? [];
  const projects = resume.projects ?? [];
  const skills = resume.skills ?? [];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-3xl px-8 py-16">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-slate-900 tracking-tight">
            {resume.title}
          </h1>
          {resume.personaName && (
            <p className="text-slate-500 mt-2">{resume.personaName}</p>
          )}
          {resume.location && (
            <p className="text-slate-500">{resume.location}</p>
          )}
        </div>

        {/* Professional Summary */}
        {resume.summary && (
          <div className="mb-8 pb-8 border-b border-slate-200">
            <p className="text-slate-700 leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-3">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="text-sm text-slate-700 px-3 py-1 bg-slate-100 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="mb-8 pb-8 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-6">
              Experience
            </h2>
            <div className="space-y-6">
              {experiences.map((exp) => {
                const start = formatDate(exp.startDate);
                const end = formatDate(exp.endDate) ?? "Present";
                const achievements = exp.achievements ?? [];
                return (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline gap-4 mb-1">
                      <h3 className="text-base font-semibold text-slate-900">{exp.role}</h3>
                      <span className="text-xs text-slate-500 whitespace-nowrap">
                        {start} – {end}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-2">{exp.company}</p>
                    {exp.description && (
                      <p className="text-slate-700 text-sm mb-2">{exp.description}</p>
                    )}
                    {achievements.length > 0 && (
                      <ul className="text-slate-700 text-sm list-disc list-inside">
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
          <div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-widest mb-6">
              Projects
            </h2>
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id}>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">
                    {project.name}
                  </h3>
                  {project.summary && (
                    <p className="text-slate-700 text-sm mb-2">{project.summary}</p>
                  )}
                  {(project.techStack ?? []).length > 0 && (
                    <p className="text-slate-600 text-xs">
                      {(project.techStack ?? []).join(" • ")}
                    </p>
                  )}
                  {project.link && (
                    <p className="text-slate-600 text-xs mt-1">
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
