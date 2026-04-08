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
    headshotUrl?: string | null;
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
      <div className="mx-auto w-full max-w-4xl px-8 py-16">
        {/* Header */}
        <div className="mb-12">
          <div className="flex gap-6 items-start">
            <div className="flex-1">
              <h1 className="text-5xl font-light text-slate-950 tracking-tight">
                {resume.title}
              </h1>
              <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                {resume.personaName && (
                  <p className="font-medium">{resume.personaName}</p>
                )}
                {resume.location && (
                  <p>{resume.location}</p>
                )}
              </div>
            </div>
            {resume.headshotUrl && (
              <div className="flex-shrink-0">
                <img
                  src={resume.headshotUrl}
                  alt="Headshot"
                  className="h-32 w-32 rounded-md object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        {resume.summary && (
          <div className="mb-12 pb-12 border-b border-slate-200">
            <p className="text-slate-700 leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-12 pb-12 border-b border-slate-200">
            <h2 className="text-xs font-semibold text-slate-950 uppercase tracking-widest mb-4">
              Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="text-sm text-slate-700 px-2 py-1"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="mb-12 pb-12 border-b border-slate-200">
            <h2 className="text-xs font-semibold text-slate-950 uppercase tracking-widest mb-8">
              Experience
            </h2>
            <div className="space-y-8">
              {experiences.map((exp) => {
                const start = formatDate(exp.startDate);
                const end = formatDate(exp.endDate) ?? "Present";
                const achievements = exp.achievements ?? [];
                return (
                  <div key={exp.id}>
                    <div className="flex justify-between items-baseline gap-4 mb-2">
                      <h3 className="text-sm font-semibold text-slate-950">{exp.role}</h3>
                      <span className="text-xs text-slate-600 whitespace-nowrap">
                        {start} – {end}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm mb-2">{exp.company}</p>
                    {exp.description && (
                      <p className="text-slate-700 text-sm mb-2 leading-relaxed">{exp.description}</p>
                    )}
                    {achievements.length > 0 && (
                      <ul className="text-slate-700 text-sm space-y-1">
                        {achievements.map((achievement, i) => (
                          <li key={`${exp.id}-achievement-${i}`} className="flex gap-2">
                            <span className="text-slate-400">•</span>
                            <span>{achievement}</span>
                          </li>
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
          <div className="mb-12 pb-12 border-b border-slate-200">
            <h2 className="text-xs font-semibold text-slate-950 uppercase tracking-widest mb-8">
              Projects
            </h2>
            <div className="space-y-8">
              {projects.map((project) => (
                <div key={project.id}>
                  <h3 className="text-sm font-semibold text-slate-950 mb-1">
                    {project.name}
                  </h3>
                  {project.summary && (
                    <p className="text-slate-700 text-sm mb-2 leading-relaxed">{project.summary}</p>
                  )}
                  {project.link && (
                    <p className="text-slate-600 text-xs mb-2">
                      {project.link}
                    </p>
                  )}
                  {(project.techStack ?? []).length > 0 && (
                    <p className="text-slate-600 text-xs">
                      {(project.techStack ?? []).join(" • ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Intro Video */}
        {resume.introVideoEmbedUrl ? (
          <div>
            <h2 className="text-xs font-semibold text-slate-950 uppercase tracking-widest mb-4">
              Introduction
            </h2>
            <div className="aspect-video overflow-hidden rounded border border-slate-200">
              <iframe
                title="Candidate introduction video"
                src={resume.introVideoEmbedUrl}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
