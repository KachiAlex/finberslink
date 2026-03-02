import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AIButton } from "@/components/ai/ai-button";
import { BulletSuggestions } from "@/components/ai/bullet-suggestions";
import { SkillAnalysis } from "@/components/ai/skill-analysis";
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

async function optimizeSummaryAction(formData: FormData) {
  "use server";

  const slug = String(formData.get("slug") ?? "").trim();
  const summary = String(formData.get("summary") ?? "").trim();

  if (!slug) {
    return;
  }

  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/optimize-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `access_token=${formData.get('accessToken')}`,
      },
      body: JSON.stringify({
        currentSummary: summary,
        experience: [], // TODO: Get from resume
        skills: [], // TODO: Get from resume
        targetRole: 'Professional',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to optimize summary');
    }

    const data = await response.json();
    
    // TODO: Update resume with optimized summary
    console.log('Optimized summary:', data.optimizedSummary);
    
    return { success: true, optimizedSummary: data.optimizedSummary };
  } catch (error) {
    console.error('Error optimizing summary:', error);
    return { success: false, error: 'Failed to optimize summary' };
  }
}

async function generateBulletsAction(formData: FormData) {
  "use server";

  const company = String(formData.get("company") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const duration = String(formData.get("duration") ?? "").trim();
  const rawDescription = String(formData.get("rawDescription") ?? "").trim();

  if (!company || !role || !duration) {
    return;
  }

  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/generate-bullets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `access_token=${formData.get('accessToken')}`,
      },
      body: JSON.stringify({
        company,
        role,
        duration,
        rawDescription,
        targetRole: 'Professional',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate bullet points');
    }

    const data = await response.json();
    
    // TODO: Update resume with generated bullets
    console.log('Generated bullets:', data.bulletPoints);
    
    return { success: true, bulletPoints: data.bulletPoints };
  } catch (error) {
    console.error('Error generating bullets:', error);
    return { success: false, error: 'Failed to generate bullet points' };
  }
}

async function analyzeSkillsAction(formData: FormData) {
  "use server";

  const experience = String(formData.get("experience") ?? "").trim();
  const targetRole = String(formData.get("targetRole") ?? "").trim();
  const jobDescription = String(formData.get("jobDescription") ?? "").trim();

  if (!experience) {
    return;
  }

  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ai/analyze-skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `access_token=${formData.get('accessToken')}`,
      },
      body: JSON.stringify({
        experience: experience.split('\n').filter(exp => exp.trim()),
        targetRole: targetRole || undefined,
        jobDescription: jobDescription || undefined,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze skills');
    }

    const data = await response.json();
    
    // TODO: Update resume with skill analysis
    console.log('Skill analysis:', data);
    
    return { success: true, analysis: data };
  } catch (error) {
    console.error('Error analyzing skills:', error);
    return { success: false, error: 'Failed to analyze skills' };
  }
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
                <input type="hidden" name="slug" value={(resume as any).slug} />
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" defaultValue={(resume as any).title} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea id="summary" name="summary" defaultValue={(resume as any).summary ?? ""} rows={4} />
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
              <AIButton 
                variant="outline" 
                className="w-full"
                formAction={optimizeSummaryAction}
              >
                AI Optimize Summary
              </AIButton>
              <Button variant="outline" className="w-full">
                Preview Public View
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Experience</CardTitle>
            <CardDescription>Add your work experience with AI assistance.</CardDescription>
          </CardHeader>
          <CardContent>
            {(resume as any).experiences.length > 0 ? (
              <div className="space-y-4">
                {(resume as any).experiences.map((experience: any) => (
                  <div key={experience.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{experience.role}</h4>
                        <p className="text-sm text-slate-600">{experience.company}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(experience.startDate).toLocaleDateString()} - {experience.endDate ? new Date(experience.endDate).toLocaleDateString() : "Present"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                    <ul className="text-sm text-slate-700 space-y-1">
                      {experience.achievements.map((achievement: any, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 pt-3 border-t">
                      <AIButton
                        variant="outline"
                        size="sm"
                        formAction={generateBulletsAction}
                      >
                        AI Generate Better Bullets
                      </AIButton>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">No work experience added yet.</p>
                <Button>Add Experience</Button>
              </div>
            )}
            
            {/* Add Experience Form */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-4">Add New Experience</h4>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" name="company" placeholder="Company name" />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Input id="role" name="role" placeholder="Job title" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" name="startDate" type="month" />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" name="endDate" type="month" placeholder="Present" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="rawDescription">Job Description (optional)</Label>
                  <Textarea
                    id="rawDescription"
                    name="rawDescription"
                    placeholder="Describe your responsibilities and achievements..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Add Experience</Button>
                  <AIButton
                    variant="outline"
                    onClick={() => {
                      // TODO: Generate bullets from form data
                      console.log('Generate bullets from form');
                    }}
                  >
                    AI Generate Bullets First
                  </AIButton>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Skills</CardTitle>
            <CardDescription>Manage your technical and soft skills with AI assistance.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Current Skills */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {resume.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
              <AIButton
                variant="outline"
                size="sm"
                formAction={analyzeSkillsAction}
              >
                AI Analyze & Suggest Skills
              </AIButton>
            </div>

            {/* AI Skill Analysis Form */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">AI Skill Analysis</h4>
              <form className="space-y-4">
                <div>
                  <Label htmlFor="experience">Experience Summary</Label>
                  <Textarea
                    id="experience"
                    name="experience"
                    placeholder="Paste your work experience descriptions here..."
                    rows={4}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    AI will analyze this to identify your skills and suggest improvements
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="targetRole">Target Role (optional)</Label>
                    <Input
                      id="targetRole"
                      name="targetRole"
                      placeholder="e.g., Software Engineer, Product Manager"
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobDescription">Job Description (optional)</Label>
                    <Input
                      id="jobDescription"
                      name="jobDescription"
                      placeholder="Paste job description for targeted analysis"
                    />
                  </div>
                </div>
                <AIButton
                  variant="default"
                  formAction={analyzeSkillsAction}
                >
                  Analyze My Skills
                </AIButton>
              </form>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Projects</CardTitle>
            <CardDescription>Featured projects</CardDescription>
          </CardHeader>
          <CardContent>
            {resume.projects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500 mb-4">No projects added yet.</p>
                <Button>Add Project</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {resume.projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">{project.name}</h4>
                        <p className="text-sm text-slate-600">{project.summary}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                    {project.techStack.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.techStack.map((tech) => (
                          <Badge key={tech} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
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
