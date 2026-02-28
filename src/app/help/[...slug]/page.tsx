import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const helpContent: Record<string, { title: string; content: string; related?: string[] }> = {
  "student/getting-started": {
    title: "Getting Started as a Student",
    content: `Welcome to Finbers Link! This guide will help you get started with your learning journey.

## Account Setup
- Complete your profile information
- Upload a professional photo
- Set your learning preferences

## Dashboard Overview
- View your enrolled courses
- Track your progress
- Access resume builder
- Check application status

## Next Steps
1. Browse available courses
2. Enroll in your first course
3. Join the community forum
4. Start building your resume`,
    related: ["student/courses", "student/resume", "student/forum"],
  },
  "student/courses": {
    title: "Course Navigation",
    content: `Learn how to navigate and get the most out of your courses.

## Enrolling in Courses
- Browse the course catalog
- Filter by category and level
- Click "Enroll" to join a course
- Access course materials immediately

## Course Structure
- Lessons organized by modules
- Video lectures and readings
- Assignments and quizzes
- Progress tracking

## Interactive Features
- Discussion forums for each lesson
- Direct messaging with tutors
- Peer collaboration tools
- Resource sharing`,
    related: ["student/getting-started", "student/forum"],
  },
  "student/resume": {
    title: "Resume Builder Guide",
    content: `Create a professional resume with our AI-powered builder.

## Getting Started
- Click "Resume Studio" from your dashboard
- Choose a template or start from scratch
- Add your personal information

## Key Sections
- Professional summary
- Work experience
- Education
- Skills and certifications
- Projects and achievements

## AI Features
- Smart content suggestions
- Keyword optimization
- Format recommendations
- Export options (PDF, Word)`,
    related: ["student/getting-started", "student/applications"],
  },
  "student/applications": {
    title: "Job Applications",
    content: `Apply for jobs and volunteer opportunities through the platform.

## Finding Opportunities
- Browse job postings
- Filter by role and location
- Save interesting positions
- Set up job alerts

## Application Process
- Attach your resume
- Write a cover letter
- Track application status
- Interview scheduling

## Tips for Success
- Tailor your resume for each role
- Research the organization
- Prepare for interviews
- Follow up appropriately`,
    related: ["student/resume", "student/getting-started"],
  },
  "student/forum": {
    title: "Forum Participation",
    content: `Engage with the community through our discussion forums.

## Forum Features
- Course-specific discussions
- General topics and networking
- Q&A with tutors and peers
- Resource sharing

## Posting Guidelines
- Be respectful and constructive
- Search before posting
- Use clear titles
- Tag relevant topics

## Getting Help
- Ask questions about course content
- Share study tips
- Connect with study partners
- Get feedback on your work`,
    related: ["student/courses", "student/getting-started"],
  },
  "tutor/dashboard": {
    title: "Tutor Dashboard",
    content: `Manage your teaching activities from the tutor dashboard.

## Overview
- View your assigned courses
- Monitor student progress
- Access teaching resources
- Schedule office hours

## Key Features
- Course management tools
- Student analytics
- Communication center
- Content creation tools

## Best Practices
- Check dashboard daily
- Respond to student questions promptly
- Update course materials regularly
- Track engagement metrics`,
    related: ["tutor/lessons", "tutor/progress"],
  },
  "tutor/lessons": {
    title: "Creating Lessons",
    content: `Design and deliver engaging lessons for your students.

## Lesson Structure
- Learning objectives
- Content delivery (video/text)
- Interactive elements
- Assessment activities

## Content Types
- Video lectures
- Reading materials
- Interactive exercises
- Discussion prompts

## Publishing
- Preview before publishing
- Set release schedule
- Monitor engagement
- Gather feedback`,
    related: ["tutor/dashboard", "tutor/progress"],
  },
  "tutor/progress": {
    title: "Student Progress Tracking",
    content: `Monitor and support student learning progress.

## Analytics Dashboard
- Completion rates
- Assessment scores
- Engagement metrics
- Time spent on content

## Intervention Strategies
- Identify at-risk students
- Send personalized messages
- Offer additional resources
- Schedule one-on-one sessions

## Reporting
- Generate progress reports
- Share insights with students
- Track improvement over time`,
    related: ["tutor/dashboard", "tutor/lessons"],
  },
  "tutor/forum": {
    title: "Forum Moderation",
    content: `Maintain a healthy and productive discussion environment.

## Moderation Tasks
- Review new posts
- Remove inappropriate content
- Guide discussions
- Answer questions

## Best Practices
- Be fair and consistent
- Encourage participation
- Model good behavior
- Provide constructive feedback

## Tools
- Content approval queue
- User moderation options
- Analytics on engagement
- Communication templates`,
    related: ["tutor/dashboard", "tutor/office-hours"],
  },
  "tutor/office-hours": {
    title: "Office Hours Management",
    content: `Schedule and conduct effective office hours.

## Scheduling
- Set regular office hours
- Offer multiple time slots
- Use calendar integration
- Send reminders

## Session Types
- One-on-one consultations
- Group study sessions
- Topic-specific workshops
- Review sessions

## Preparation
- Review student questions
- Prepare relevant materials
- Set clear objectives
- Follow up afterward`,
    related: ["tutor/dashboard", "tutor/forum"],
  },
  "admin/overview": {
    title: "Admin Overview",
    content: `Manage the Finbers Link platform as an administrator.

## Admin Dashboard
- Platform statistics
- User management
- Content moderation
- System health monitoring

## Key Responsibilities
- User account management
- Course oversight
- Content approval
- Support ticket handling

## Security
- Monitor access logs
- Manage permissions
- Update security settings
- Backup and recovery`,
    related: ["admin/users", "admin/courses"],
  },
  "admin/users": {
    title: "User Management",
    content: `Manage user accounts and permissions.

## User Types
- Students
- Tutors
- Administrators
- Guest accounts

## Account Actions
- Create accounts
- Update profiles
- Reset passwords
- Manage permissions

## Bulk Operations
- Import users
- Export data
- Send announcements
- Generate reports`,
    related: ["admin/overview", "admin/courses"],
  },
  "admin/courses": {
    title: "Course Management",
    content: `Oversee course creation and delivery.

## Course Approval
- Review new course proposals
- Ensure quality standards
- Assign tutors
- Set pricing

## Quality Assurance
- Monitor course ratings
- Review student feedback
- Audit content
- Update curriculum

## Analytics
- Enrollment statistics
- Completion rates
- Revenue tracking
- Performance metrics`,
    related: ["admin/overview", "admin/users"],
  },
  "admin/news": {
    title: "News & Announcements",
    content: `Manage platform communications and announcements.

## Content Types
- Platform updates
- Feature announcements
- Educational content
- Community spotlights

## Publishing Workflow
- Draft creation
- Review process
- Scheduling
- Distribution

## Analytics
- Read statistics
- Engagement metrics
- Click-through rates
- User feedback`,
    related: ["admin/overview", "admin/settings"],
  },
  "admin/settings": {
    title: "Platform Settings",
    content: `Configure platform-wide settings and preferences.

## System Configuration
- Platform branding
- Feature toggles
- Integration settings
- Security options

## User Experience
- Interface customization
- Notification preferences
- Language settings
- Accessibility options

## Technical Settings
- Database configuration
- API settings
- Backup schedules
- Performance monitoring`,
    related: ["admin/overview", "admin/news"],
  },
};

export default async function HelpGuidePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const content = helpContent[slugPath];

  if (!content) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-slate-600">
          <Link href="/help" className="hover:text-slate-900">
            Help Center
          </Link>
          <span>/</span>
          <span className="text-slate-900">{content.title}</span>
        </nav>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-slate-900">
              {content.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none">
              {content.content.split("\n\n").map((paragraph, i) => {
                if (paragraph.startsWith("## ")) {
                  return (
                    <h2 key={i} className="text-xl font-semibold text-slate-900 mt-8 mb-4">
                      {paragraph.replace("## ", "")}
                    </h2>
                  );
                }
                if (paragraph.startsWith("- ")) {
                  return (
                    <ul key={i} className="list-disc list-inside space-y-2 text-slate-700">
                      {paragraph.split("\n").map((item, j) => (
                        <li key={j}>{item.replace("- ", "")}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className="text-slate-700 leading-relaxed mb-4">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {content.related && content.related.length > 0 && (
              <div className="mt-8 pt-8 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Related Guides</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {content.related.map((relatedSlug) => {
                    const relatedContent = helpContent[relatedSlug];
                    if (!relatedContent) return null;
                    return (
                      <Button key={relatedSlug} variant="outline" asChild>
                        <Link href={`/help/${relatedSlug}`}>{relatedContent.title}</Link>
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </article>
    </main>
  );
}
