import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getResumeBySlug } from "@/features/resume/service";

async function updateResumeAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();

  if (!slug || !title) {
    return;
  }

  // TODO: update resume in DB
  // await updateResume(slug, { title, summary });

  revalidatePath(`/resume/${slug}/edit`);
}

export default async function ResumeEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resume = await getResumeBySlug(slug);
  if (!resume) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">Edit Resume</h1>
          <p className="text-slate-600">Update your resume details and sections.</p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Basic Info</CardTitle>
              <CardDescription>Title and summary</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" action={updateResumeAction}>
                <input type="hidden" name="slug" value={resume.slug} />
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" defaultValue={resume.title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea id="summary" name="summary" defaultValue={resume.summary ?? ""} rows={4} />
                </div>
                <Button type="submit">Save changes</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                Add Experience
              </Button>
              <Button variant="outline" className="w-full">
                Add Project
              </Button>
              <Button variant="outline" className="w-full">
                AI Optimize Summary
              </Button>
              <Button variant="outline" className="w-full">
                Preview Public View
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Experience</CardTitle>
            <CardDescription>Your work history</CardDescription>
          </CardHeader>
          <CardContent>
            {resume.experiences.length === 0 ? (
              <p className="text-sm text-slate-500">No experience added yet.</p>
            ) : (
              <div className="space-y-4">
                {resume.experiences.map((exp) => (
                  <div key={exp.id} className="border-l-2 border-slate-200 pl-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">{exp.role}</h4>
                      <span className="text-sm text-slate-500">
                        {exp.startDate.toLocaleDateString()} –{" "}
                        {exp.endDate?.toLocaleDateString() || "Present"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{exp.company}</p>
                    {exp.description && (
                      <p className="text-sm text-slate-600 mt-1">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Projects</CardTitle>
            <CardDescription>Featured projects</CardDescription>
          </CardHeader>
          <CardContent>
            {resume.projects.length === 0 ? (
              <p className="text-sm text-slate-500">No projects added yet.</p>
            ) : (
              <div className="space-y-4">
                {resume.projects.map((project) => (
                  <div key={project.id} className="border-l-2 border-slate-200 pl-4">
                    <h4 className="font-semibold text-slate-900">{project.name}</h4>
                    {project.summary && (
                      <p className="text-sm text-slate-600 mt-1">{project.summary}</p>
                    )}
                    {project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.techStack.map((tech) => (
                          <span key={tech} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
