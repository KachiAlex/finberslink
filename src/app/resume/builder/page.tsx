import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createResume } from "@/features/resume/service";
import { ResumeSchema } from "@/features/resume/schemas";

async function createResumeAction(formData: FormData) {
  "use server";

  const parsed = ResumeSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
  });

  if (!parsed.success) {
    return;
  }

  try {
    const resume = await createResume(parsed.data);
    redirect(`/resume/${resume.slug}/edit`);
  } catch {
    // TODO: surface errors
    return;
  }
}

export default function ResumeBuilderPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Resume Studio</h1>
          <p className="text-slate-600">Create an ATS-ready resume with AI assistance.</p>
        </header>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900">Start your resume</CardTitle>
            <CardDescription>Give your resume a title and a brief summary to begin.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" action={createResumeAction}>
              <div className="space-y-2">
                <Label htmlFor="title">Resume title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Product Manager Resume"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="summary">Professional summary</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  placeholder="Brief overview of your experience and goals..."
                  rows={4}
                />
              </div>
              <Button type="submit" className="w-full">
                Create resume
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
