import { BookOpen, Trophy, Zap } from "lucide-react";
import Link from "next/link";

import { DashboardSectionsClient } from "@/app/dashboard/sections-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { buildDashboardCoursesUrl } from "@/lib/dashboard-courses-url";
import { GraduationCap, LayoutDashboard, MessageSquare, Sparkles, Briefcase, ClipboardList } from "lucide-react";

interface StudentDashboardProps {
  userId: string;
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  accent: string;
}) => (
  <Card className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="pt-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className={`rounded-lg p-3 ${accent}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-600">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function StudentDashboard(_props: StudentDashboardProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr] xl:grid-cols-[300px_1fr]">
      <DashboardSidebar
        title="Student Hub"
        subtitle="Everything tied to your learning arc sits here—no more scattered cards."
        meta="Focus mode"
        items={[
          {
            label: "Dashboard",
            description: "Overview & quick stats",
            href: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            label: "Courses",
            description: "Browse catalog & enroll",
            href: buildDashboardCoursesUrl(),
            icon: GraduationCap,
          },
          {
            label: "Resumes",
            description: "Create & manage resumes",
            href: "/resumes",
            icon: Sparkles,
          },
          {
            label: "Jobs",
            description: "Find opportunities",
            href: "/jobs",
            icon: Briefcase,
          },
          {
            label: "Applications",
            description: "Track submissions",
            href: "/dashboard/applications",
            icon: ClipboardList,
          },
          {
            label: "Messages",
            description: "Notifications & inbox",
            href: "/notifications",
            icon: MessageSquare,
          },
        ]}
        footer={
          <>
            <p className="font-medium text-slate-900">Stuck?</p>
            <p className="text-sm text-slate-600">Join the community forum to get help fast.</p>
            <Link href="/forum" className="mt-2 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
              Go to forum →
            </Link>
          </>
        }
      />

      <div className="space-y-8">
        {/* Promotional Banner */}
        <Card className="border-0 bg-gradient-to-r from-slate-900 to-slate-800 text-white overflow-hidden">
          <CardContent className="p-0">
            <div className="grid gap-6 p-6 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="mb-2 text-lg font-bold">WE OFFER SELF PACED AGILE VIRTUAL CERTIFICATIONS COURSES</h3>
                <ul className="space-y-1 text-sm text-gray-200">
                  <li>✓ Agile certification prep</li>
                  <li>✓ Industry recognized credentials</li>
                  <li>✓ Expert-led sessions</li>
                </ul>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <div>
                  <p className="text-xs text-gray-400">Contact</p>
                  <p className="text-xl font-bold">+234 803 655 5555</p>
                  <p className="text-xs text-gray-400">CYBSECURITY@FINBERSGROUP.COM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Greeting Section */}
        <div>
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white">
              F
            </div>
            <div>
              <p className="text-sm text-slate-600">Hello,</p>
              <h1 className="text-3xl font-bold text-slate-900">Finbers</h1>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            icon={BookOpen}
            label="Enrolled Courses"
            value="0"
            accent="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={Zap}
            label="Active Courses"
            value="0"
            accent="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={Trophy}
            label="Completed Courses"
            value="0"
            accent="bg-blue-50 text-blue-600"
          />
        </div>

        {/* My Courses Section */}
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">My Courses</h2>
            <Link href="/dashboard/courses">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          <Card className="border-0 bg-white">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="pb-3 text-left text-sm font-semibold text-slate-600">Course Name</th>
                      <th className="pb-3 text-left text-sm font-semibold text-slate-600">Enrolled</th>
                      <th className="pb-3 text-left text-sm font-semibold text-slate-600">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 text-sm text-slate-900">Infodemic Management</td>
                      <td className="py-3 text-sm text-slate-600">0</td>
                      <td className="py-3 text-sm">
                        <span className="text-yellow-400">★★★★★</span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 text-sm text-slate-900">Process Improvement (Result driven course)</td>
                      <td className="py-3 text-sm text-slate-600">23</td>
                      <td className="py-3 text-sm">
                        <span className="text-yellow-400">★★★★★</span>
                      </td>
                    </tr>
                    <tr className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 text-sm text-slate-900">Soft Skill Course (In conjunction with HCPA) - Cynthia Eguozuwa</td>
                      <td className="py-3 text-sm text-slate-600">147</td>
                      <td className="py-3 text-sm">
                        <span className="text-yellow-400">★★★★★</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-3 text-sm text-slate-900">Test Course</td>
                      <td className="py-3 text-sm text-slate-600">0</td>
                      <td className="py-3 text-sm">
                        <span className="text-yellow-400">★★★★★</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Empty State Note */}
              <div className="mt-8 text-center">
                <p className="text-sm text-slate-600">Enroll in courses to start your learning journey</p>
                <Link href="/dashboard/courses">
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Browse Courses</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sections Client for Dynamic Content */}
        <DashboardSectionsClient />
      </div>
    </div>
  );
}
