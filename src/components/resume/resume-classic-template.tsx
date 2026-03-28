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

export function ResumeClassicTemplate({ resume }: ResumeTemplateProps) {
  const experiences = resume.experiences ?? [];
  const projects = resume.projects ?? [];
  const skills = resume.skills ?? [];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-4xl px-8 py-12">
        {/* Header */}
        <div className="border-b-2 border-slate-950 pb-6 mb-8">
          <div className="flex gap-6 items-start">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-950">{resume.title}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                {resume.personaName && <span>{resume.personaName}</span>}
                {resume.location && <span>{resume.location}</span>}
              </div>
            </div>
            {resume.headshotUrl && (
              <div className="flex-shrink-0">
                <img
                  src={resume.headshotUrl}
                  alt="Headshot"
                  className="h-28 w-28 rounded object-cover border border-slate-950"
                />
              </div>
            )}
          </div>
        </div>

        {/* Professional Summary */}
        {resume.summary && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-3">
              Professional Summary
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">{resume.summary}</p>
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-3">
              Skills
            </h2>
            <p className="text-sm text-slate-700">
              {skills.join(" • ")}
            </p>
          </div>
        )}

        {/* Experience */}
        {experiences.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-4">
              Professional Experience
            </h2>
            <div className="space-y-5">
              {experiences.map((exp) => {
                const start = formatDate(exp.startDate);
                const end = formatDate(exp.endDate) ?? "Present";
                const achievements = exp.achievements ?? [];
                return (
                  <div key={exp.id}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-950">{exp.role}</p>
                        <p className="text-sm text-slate-700">{exp.company}</p>
                      </div>
                      <span className="text-xs text-slate-600 whitespace-nowrap ml-4 font-semibold">
                        {start} – {end}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-sm text-slate-700 mt-2">{exp.description}</p>
                    )}
                    {achievements.length > 0 && (
                      <ul className="mt-2 text-sm text-slate-700">
                        {achievements.map((achievement, i) => (
                          <li key={`${exp.id}-achievement-${i}`} className="flex gap-2">
                            <span>•</span>
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
          <div className="mb-8">
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-4">
              Projects
            </h2>
            <div className="space-y-5">
              {projects.map((project) => (
                <div key={project.id}>
                  <p className="font-bold text-slate-950">{project.name}</p>
                  {project.summary && (
                    <p className="text-sm text-slate-700 mt-1">{project.summary}</p>
                  )}
                  {project.link && (
                    <p className="text-sm text-slate-700 mt-1">
                      {project.link}
                    </p>
                  )}
                  {(project.techStack ?? []).length > 0 && (
                    <p className="text-sm text-slate-700 mt-1">
                      Tech: {(project.techStack ?? []).join(", ")}
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
            <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wider mb-3">
              Introduction Video
            </h2>
            <div className="aspect-video overflow-hidden rounded border border-slate-300">
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
