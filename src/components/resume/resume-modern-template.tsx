import type {
  ResumeExperience,
  ResumeProject,
  ResumeVisibility,
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
    <main className="min-h-screen bg-gradient-to-b from-slate-0 via-white to-slate-50">
      <div className="mx-auto w-full max-w-4xl px-4 py-0 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-8 py-12 rounded-b-2xl shadow-lg">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            {resume.title}
          </h1>
          {resume.personaName && (
            <p className="text-lg text-slate-300 mb-1">{resume.personaName}</p>
          )}
          {resume.location && (
            <p className="text-slate-400">{resume.location}</p>
          )}
          {resume.summary ? (
            <p className="mt-4 text-base leading-relaxed text-slate-100 max-w-2xl">
              {resume.summary}
            </p>
          ) : null}
        </div>

        {/* Content Section */}
        <div className="px-8 py-12 space-y-10">
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
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 pb-2 border-b-2 border-slate-900">
                Core Skills
              </h3>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-slate-100 text-slate-900 rounded text-sm font-medium hover:bg-slate-900 hover:text-white transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {experiences.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 pb-2 border-b-2 border-slate-900">
                Professional Experience
              </h3>
              <div className="space-y-8">
                {experiences.map((exp) => {
                  const start = formatDate(exp.startDate);
                  const end = formatDate(exp.endDate) ?? "Present";
                  const achievements = exp.achievements ?? [];
                  return (
                    <div key={exp.id}>
                      <div className="flex items-baseline justify-between gap-4 mb-2">
                        <div>
                          <h4 className="font-bold text-lg text-slate-900">{exp.role}</h4>
                          <p className="text-slate-600 font-semibold">{exp.company}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap font-semibold">
                          {start} – {end}
                        </span>
                      </div>
                      {exp.description ? (
                        <p className="text-slate-700 mb-3 leading-relaxed">{exp.description}</p>
                      ) : null}
                      {achievements.length > 0 && (
                        <ul className="space-y-1 text-slate-700">
                          {achievements.map((achievement, i) => (
                            <li key={`${exp.id}-achievement-${i}`} className="flex gap-2">
                              <span className="text-slate-400 mt-1">•</span>
                              <span>{achievement}</span>
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

          {projects.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 pb-2 border-b-2 border-slate-900">
                Notable Projects
              </h3>
              <div className="space-y-6">
                {projects.map((project) => (
                  <div key={project.id}>
                    <h4 className="font-bold text-slate-900 text-lg mb-2">{project.name}</h4>
                    {project.summary && (
                      <p className="text-slate-700 mb-2 leading-relaxed">{project.summary}</p>
                    )}
                    {(project.techStack ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(project.techStack ?? []).map((tech) => (
                          <span
                            key={`${project.id}-${tech}`}
                            className="px-2 py-0.5 bg-slate-800 text-white text-xs rounded font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-900 font-semibold hover:text-slate-600 transition-colors inline-flex items-center gap-1"
                      >
                        View Project →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
