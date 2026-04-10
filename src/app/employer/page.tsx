import { redirect } from "next/navigation";
import { requireSession } from "../../lib/auth/session";
import { EmployerDashboard } from "./_components/employer-dashboard";

export const metadata = {
  title: "Finbers Link | Employer Portal",
  description: "Manage job postings and review applications.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EmployerPage() {
  const session = await requireSession({
    allowedRoles: ["ADMIN", "EMPLOYER"],
    failureMode: "redirect",
  });

  // For now, redirect admins to admin jobs page
  if (session.role === "ADMIN") {
    redirect("/admin/jobs");
  }

  return <EmployerDashboard userId={session.sub} userRole={session.role} />;
}
