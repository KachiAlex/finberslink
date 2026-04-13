import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const helpSections = [
  {
    role: "Student",
    icon: "🎓",
    description: "Learn how to navigate courses, build your resume, and apply for opportunities.",
    guides: [
      { title: "Getting Started", slug: "student/getting-started" },
      { title: "Course Navigation", slug: "student/courses" },
      { title: "Resume Builder", slug: "student/resume" },
      { title: "Job Applications", slug: "student/applications" },
      { title: "Forum Participation", slug: "student/forum" },
    ],
  },
  {
    role: "Tutor",
    icon: "👨‍🏫",
    description: "Manage cohorts, create lessons, and moderate discussions.",
    guides: [
      { title: "Tutor Dashboard", slug: "tutor/dashboard" },
      { title: "Creating Lessons", slug: "tutor/lessons" },
      { title: "Student Progress Tracking", slug: "tutor/progress" },
      { title: "Forum Moderation", slug: "tutor/forum" },
      { title: "Office Hours", slug: "tutor/office-hours" },
    ],
  },
  {
    role: "Admin",
    icon: "⚙️",
    description: "Platform administration, user management, and analytics.",
    guides: [
      { title: "Admin Overview", slug: "admin/overview" },
      { title: "User Management", slug: "admin/users" },
      { title: "Course Management", slug: "admin/courses" },
      { title: "News & Announcements", slug: "admin/news" },
      { title: "Platform Settings", slug: "admin/settings" },
    ],
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Help Center</h1>
          <p className="text-slate-600">Guides and resources to make the most of Finbers Link.</p>
        </header>

        <div className="grid gap-8 md:grid-cols-3">
          {helpSections.map((section) => (
            <Card key={section.role} className="border border-slate-200/70 bg-white/95">
              <CardHeader className="text-center">
                <div className="text-4xl mb-4">{section.icon}</div>
                <CardTitle className="text-xl font-semibold text-slate-900">
                  {section.role}
                </CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.guides.map((guide) => (
                    <Button
                      key={guide.slug}
                      variant="ghost"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href={`/help/${guide.slug}`}>{guide.title}</Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Button variant="outline" asChild>
                <Link href="/courses">Browse Courses</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/jobs">Find Opportunities</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/forum">Community Forum</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/news">Latest Updates</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900">Still need help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Reach out to our support team for personalized assistance.
              </p>
              <div className="flex gap-3">
                <Button asChild>
                  <Link href="mailto:support@finberslink.com">Email Support</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/forum">Ask Community</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
