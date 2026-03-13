import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import type { Role } from "@prisma/client";

// Import role-specific dashboard components
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TutorDashboard } from "@/components/dashboard/tutor-dashboard";
import { EmployerDashboard } from "@/components/dashboard/employer-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export const metadata = {
  title: "Finbers Link | Dashboard",
  description: "Your personalized dashboard with insights, metrics, and quick actions.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const session = await requireSession({
    failureMode: "error",
  });

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

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900">
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-br from-blue-100/70 via-white to-cyan-50 blur-2xl" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        {getDashboardComponent(session.role as Role)}
      </div>
    </main>
  );
}
