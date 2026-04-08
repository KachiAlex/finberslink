import { requireAdminUser } from "@/features/admin/service";
import { AdminShell } from "../_components/admin-shell";
import AdminCoursesPageClient from "./page-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCoursesPage() {
  const admin = await requireAdminUser();
  
  return (
    <AdminShell>
      <AdminCoursesPageClient />
    </AdminShell>
  );
}

