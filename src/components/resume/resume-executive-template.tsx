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

export function ResumeExecutiveTemplate({ resume }: ResumeTemplateProps) {
  const experiences = resume.experiences ?? [];
  const projects = resume.projects ?? [];
  const skills = resume.skills ?? [];

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-4xl px-8 py-16">
        {/* Executive Header */}
        <header className="mb-12 pb-8 border-b border-slate-300">
          <div className="flex gap-6 items-start">
            <div className="flex-1">
              <h1 className="text-5xl font-bold text-slate-950 tracking-tight mb-1">
                {resume.title}
              </h1>
              
              <div className="mt-4 flex flex-col gap-1">
                {resume.personaName && (
                  <p className="text-lg font-semibold text-slate-700">{resume.personaName}</p>
                )}
                {resume.location && (
                  <p className="text-slate-600">{resume.location}</p>
                )}
              </div>

              {resume.summary && (
                <p className="mt-6 text-slate-700 leading-relaxed max-w-3xl text-base">
                  {resume.summary}
                </p>
              )}
            </div>
            {resume.headshotUrl && (
              <div className="flex-shrink-0">
                <img
                  src={resume.headshotUrl}
                  alt="Headshot"
                  className="h-32 w-32 rounded-lg object-cover border border-slate-300"
                />
              </div>
            )}
          </div>
        </header>

        <div className="space-y-10">
          {/* Intro Video */}
          {resume.introVideoEmbedUrl ? (
            <section>
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest mb-4 pb-2 border-b border-slate-300">
                Executive Introduction
              </h3>
              <div className="aspect-video overflow-hidden rounded-lg border border-slate-300">
                <iframe
                  title="Executive introduction video"
                  src={resume.introVideoEmbedUrl}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          ) : null}

          {/* Core Competencies */}
          {skills.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest mb-4 pb-2 border-b border-slate-300">
                Core Competencies
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {skills.map((skill) => (
                  <div
                    key={skill}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 text-slate-900 text-sm"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Professional Experience */}
          {experiences.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest mb-6 pb-2 border-b border-slate-300">
                Professional Experience
              </h3>
              <div className="space-y-10">
                {experiences.map((exp, idx) => {
                  const start = formatDate(exp.startDate);
                  const end = formatDate(exp.endDate) ?? "Present";
                  const achievements = exp.achievements ?? [];
                  return (
                    <div key={exp.id} className={idx !== 0 ? "pt-4" : ""}>
                      <div className="flex items-baseline justify-between gap-4 mb-1">
                        <div>
                          <h4 className="text-lg font-bold text-slate-950">{exp.role}</h4>
                          <p className="text-slate-700 font-semibold text-base">{exp.company}</p>
                        </div>
                        <span className="text-xs text-slate-600 whitespace-nowrap font-semibold">
                          {start} – {end}
                        </span>
                      </div>
                      
                      {exp.description && (
                        <p className="text-slate-700 mt-2 leading-relaxed text-sm">
                          {exp.description}
                        </p>
                      )}
                      
                      {achievements.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                          {achievements.map((achievement, i) => (
                            <li key={`${exp.id}-achievement-${i}`} className="flex gap-3 text-sm">
                              <span className="text-slate-400 mt-1 flex-shrink-0">▸</span>
                              <span className="text-slate-700">{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Notable Projects */}
          {projects.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest mb-6 pb-2 border-b border-slate-300">
                Key Projects
              </h3>
              <div className="space-y-8">
                {projects.map((project) => (
                  <div key={project.id}>
                    <div className="flex items-baseline justify-between gap-4">
                      <h4 className="font-bold text-slate-950 text-base">{project.name}</h4>
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
                        >
                          View →
                        </a>
                      )}
                    </div>
                    
                    {project.summary && (
                      <p className="text-slate-700 mt-2 leading-relaxed text-sm">
                        {project.summary}
                      </p>
                    )}
                    
                    {(project.techStack ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(project.techStack ?? []).map((tech) => (
                          <span
                            key={`${project.id}-${tech}`}
                            className="px-2 py-1 bg-slate-100 text-slate-700 text-xs border border-slate-200"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-300">
          <p className="text-xs text-slate-500">
            Created on {new Date().toLocaleDateString()}
          </p>
        </footer>
      </div>
    </main>
  );
}
