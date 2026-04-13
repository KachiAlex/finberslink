import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { getStudentProfile } from "@/features/profile/service";
import { ProfileClient } from "./profile-client";

export const dynamic = "force-dynamic";

export default async function DashboardProfilePage() {
  const session = await requireSession({ allowedRoles: ["STUDENT"] });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
      profile: {
        select: {
          headline: true,
          bio: true,
          location: true,
          skills: true,
          interests: true,
        },
      },
      resumes: {
        select: { id: true, title: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
      _count: {
        select: {
          resumes: true,
          jobApplications: true,
          enrollments: true,
        },
      },
    },
  });

  if (!user) {
    return (
      <div className="py-12 text-center text-slate-500">Account not found.</div>
    );
  }

  return (
    <ProfileClient
      firstName={user.firstName}
      lastName={user.lastName}
      email={user.email}
      avatarUrl={user.avatarUrl}
      profile={user.profile}
      resumes={user.resumes.map((r) => ({
        id: r.id,
        title: r.title,
        updatedAt: r.updatedAt.toISOString(),
      }))}
      resumeCount={user._count.resumes}
      applicationCount={user._count.jobApplications}
      enrollmentCount={user._count.enrollments}
    />
  );
}
