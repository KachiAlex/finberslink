import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getResumeBySlug } from "@/features/resume/service";

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
};

export default async function ResumePublicPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const resume = await getResumeBySlug(slug);
  if (!resume || resume.visibility !== "PUBLIC") {
    notFound();
  }

  const experiences = resume.experiences ?? [];
  const projects = resume.projects ?? [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold text-slate-900">{resume.title}</CardTitle>
                {resume.summary ? <CardDescription className="mt-2">{resume.summary}</CardDescription> : null}
              </div>
              <Badge variant="outline" className="capitalize">
                {resume.visibility.toLowerCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {experiences.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Experience</h3>
                <div className="space-y-4">
                  {experiences.map((exp) => {
                    const start = formatDate(exp.startDate);
                    const end = formatDate(exp.endDate) ?? "Present";
                    const achievements = exp.achievements ?? [];
                    return (
                      <div key={exp.id} className="border-l-2 border-slate-200 pl-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900">{exp.role}</h4>
                          <span className="text-sm text-slate-500">
                            {start} – {end}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{exp.company}</p>
                        {exp.description ? (
                          <p className="text-sm text-slate-600 mt-1">{exp.description}</p>
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
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Projects</h3>
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div key={project.id} className="border-l-2 border-slate-200 pl-4">
                      <h4 className="font-semibold text-slate-900">{project.name}</h4>
                      {project.summary && (
                        <p className="text-sm text-slate-600 mt-1">{project.summary}</p>
                      )}
                      {project.link && (
                        <a
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline mt-1 block"
                        >
                          View project
                        </a>
                      )}
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

            <div className="pt-6 border-t border-slate-100">
              <Button variant="outline" asChild>
                <a href={`mailto:?subject=Regarding your resume: ${resume.title}`}>
                  Contact
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
