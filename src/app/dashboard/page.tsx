import { redirect } from "next/navigation";
import { requireSession } from "../../lib/auth/session";
import type { Role } from "@prisma/client";

// Import role-specific dashboard components
import { StudentDashboard } from "../../components/dashboard/student-dashboard";
import { TutorDashboard } from "../../components/dashboard/tutor-dashboard";
import { EmployerDashboard } from "../../components/dashboard/employer-dashboard";
import { AdminDashboard } from "../../components/dashboard/admin-dashboard";

export const metadata = {
  title: "Finbers Link | Dashboard",
  description: "Your personalized dashboard with insights, metrics, and quick actions.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  if (process.env.NODE_ENV !== "production") {
    console.log('[dashboard] entering DashboardPage, calling requireSession');
  }

  const session = await requireSession({
    failureMode: "error",
  });

  if (process.env.NODE_ENV !== "production") {
    console.log('[dashboard] requireSession returned session for', session?.sub, session?.role);
  }

  // Route to appropriate dashboard based on role
  const getDashboardComponent = (role: Role) => {
    switch (role) {
      case "STUDENT":
        return <StudentDashboard userId={session.sub} />;
      case "TUTOR":
        return <TutorDashboard userId={session.sub} />;
      case "EMPLOYER":
        return <EmployerDashboard userId={session.sub} />;
      case "ADMIN":
      case "SUPER_ADMIN":
        return <AdminDashboard />;
      default:
        return <StudentDashboard userId={session.sub} />;
    }
  };

  return getDashboardComponent(session.role as Role);
}
