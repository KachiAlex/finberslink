import { ArrowUpDown, Filter, MailPlus, Save, Search, Users } from "lucide-react";
import { Prisma, UserStatus as PrismaUserStatus, Role as PrismaRole } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createTenantInvite,
  listAllUsers,
  updateUserRole,
  updateUserStatus,
} from "@/features/admin/service";
import { upsertStudentProfile } from "@/features/profile/service";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminUser } from "@/features/admin/service";
import { hashPassword } from "@/lib/auth/password";

type Role = PrismaRole;
type UserStatus = PrismaUserStatus;
type AdminRole = Extract<Role, "STUDENT" | "TUTOR" | "ADMIN" | "SUPER_ADMIN">;
type TenantUserRole = Extract<Role, "STUDENT" | "TUTOR">;

import { AdminShell } from "../_components/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const roleColors = {
  STUDENT: "bg-blue-100 text-blue-800",
  TUTOR: "bg-green-100 text-green-800",
  ADMIN: "bg-purple-100 text-purple-800",
  SUPER_ADMIN: "bg-red-100 text-red-800",
  EMPLOYER: "bg-orange-100 text-orange-800",
};

const statusColors = {
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-red-100 text-red-800",
  INVITED: "bg-yellow-100 text-yellow-800",
};

function buildPageRange(current: number, total: number) {
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }
  return pages;
}

export default async function AdminUsersPage(props: any) {
  const { searchParams } = props as {
    searchParams?: {
      role?: string;
      status?: string;
      search?: string;
      page?: string;
      error?: string;
      success?: string;
    };
  };
  const filters = {
    role: searchParams?.role as Role | undefined,
    status: searchParams?.status as UserStatus | undefined,
    search: searchParams?.search,
    page: searchParams?.page ? parseInt(searchParams.page, 10) || 1 : 1,
  };

  const result = await listAllUsers(filters);
  const error = searchParams?.error;
  const success = searchParams?.success;

  async function createUserAction(formData: FormData) {
    "use server";

    const admin = await requireAdminUser();

    const email = String(formData.get("email") ?? "").toLowerCase();
    const password = String(formData.get("password") ?? "");
    const role = (String(formData.get("role") ?? "STUDENT") as TenantUserRole) ?? "STUDENT";
    const firstName = String(formData.get("firstName") ?? "");
    const lastName = String(formData.get("lastName") ?? "");
    const phone = String(formData.get("phone") ?? "").trim();
    const address = String(formData.get("address") ?? "").trim();
    const certificationsRaw = String(formData.get("certifications") ?? "").trim();
    const certifications = certificationsRaw ? certificationsRaw.split("\n").map(s => s.trim()).filter(Boolean) : [];
    const educationRaw = String(formData.get("education") ?? "").trim();
    const education = educationRaw ? JSON.parse(educationRaw) : undefined;

    if (!email || !password) return;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      redirect("/admin/users?error=email-exists");
    }

    const passwordHash = await hashPassword(password);
    try {
      await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash,
          role,
          status: PrismaUserStatus.ACTIVE,
          tenantId: admin.tenantId,
        },
      });
      // Persist profile details
      const created = await prisma.user.findUnique({ where: { email } });
      if (created) {
        await upsertStudentProfile({
          userId: created.id,
          headline: undefined,
          bio: undefined,
          location: undefined,
          phone: phone || undefined,
          address: address || undefined,
          certifications: certifications.length ? certifications : undefined,
          education: education ?? undefined,
        });
      }
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        redirect("/admin/users?error=email-exists");
      }
      throw err;
    }

    revalidatePath("/admin/users");
    redirect("/admin/users?success=user-created");
  }

  async function createInviteAction(formData: FormData) {
    "use server";

    const admin = await requireAdminUser();

    const email = String(formData.get("inviteEmail") ?? "").toLowerCase();
    const role = String(formData.get("inviteRole") ?? "STUDENT") as TenantUserRole;
    const days = Number(formData.get("expiresIn") ?? "7");
    const phone = String(formData.get("invitePhone") ?? "").trim();
    const address = String(formData.get("inviteAddress") ?? "").trim();
    const certificationsRaw = String(formData.get("inviteCertifications") ?? "").trim();
    const certifications = certificationsRaw ? certificationsRaw.split("\n").map(s => s.trim()).filter(Boolean) : [];
    const educationRaw = String(formData.get("inviteEducation") ?? "").trim();
    const education = educationRaw ? JSON.parse(educationRaw) : undefined;

    if (!email) return;

    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await createTenantInvite({
      tenantId: admin.tenantId!,
      email,
      role,
      createdById: admin.id,
      expiresAt,
      meta: {
        phone: phone || undefined,
        address: address || undefined,
        certifications: certifications.length ? certifications : undefined,
        education: education ?? undefined,
      },
    });

    revalidatePath("/admin/users");
  }

  return (
    <div className="space-y-6">
      <AdminShell
        title="User Management"
        description="Manage all platform users, roles, and permissions."
      >
        {(error || success) && (
          <Card className={error ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}>
            <CardContent className="py-3 text-sm">
              {error === "email-exists" && (
                <div className="text-red-700">
                  Email already exists. Use a different email or invite the existing user.
                </div>
              )}
              {success === "user-created" && <div className="text-emerald-700">User created successfully.</div>}
            </CardContent>
          </Card>
        )}
        {/* Create or invite tenant users */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Save className="h-4 w-4 text-slate-500" />
                Create tenant user (Student/Tutor)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createUserAction} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-slate-700">First name</Label>
                    <Input name="firstName" placeholder="First name" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-slate-700">Last name</Label>
                    <Input name="lastName" placeholder="Last name" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-slate-700">Phone</Label>
                    <Input name="phone" placeholder="+1234567890" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-slate-700">Address</Label>
                    <Input name="address" placeholder="City, Country" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Certifications (one per line)</Label>
                  <Textarea name="certifications" rows={3} placeholder="Certificate A\nCertificate B" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Education (JSON)</Label>
                  <Textarea name="education" rows={3} placeholder='[{"degree":"BSc","institution":"X","year":2020}]' />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Email</Label>
                  <Input name="email" type="email" placeholder="user@tenant.com" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Password</Label>
                  <Input name="password" type="password" placeholder="Temp password" required />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Role</Label>
                  <select
                    name="role"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                    defaultValue="STUDENT"
                  >
                    <option value="STUDENT">Student</option>
                    <option value="TUTOR">Tutor</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">
                  Save user
                </Button>
                <p className="text-xs text-slate-500">
                  Accounts are created ACTIVE and scoped to your tenant.
                </p>
              </form>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <MailPlus className="h-4 w-4 text-slate-500" />
                Invite tenant user (Student/Tutor)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form action={createInviteAction} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Email</Label>
                  <Input name="inviteEmail" type="email" placeholder="user@tenant.com" required />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-slate-700">Phone</Label>
                    <Input name="invitePhone" placeholder="+1234567890" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-slate-700">Address</Label>
                    <Input name="inviteAddress" placeholder="City, Country" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Certifications (one per line)</Label>
                  <Textarea name="inviteCertifications" rows={3} placeholder="Certificate A\nCertificate B" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium text-slate-700">Education (JSON)</Label>
                  <Textarea name="inviteEducation" rows={3} placeholder='[{"degree":"BSc","institution":"X","year":2020}]' />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-slate-700">Role</Label>
                    <select
                      name="inviteRole"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      defaultValue="STUDENT"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TUTOR">Tutor</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-medium text-slate-700">Expires in</Label>
                    <select
                      name="expiresIn"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                      defaultValue="7"
                    >
                      <option value="3">3 days</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" className="w-full" variant="outline">
                  Generate invite
                </Button>
                <p className="text-xs text-slate-500">
                  Invites are scoped to your tenant and expire automatically.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  name="search"
                  placeholder="Search users..."
                  defaultValue={filters.search}
                  className="pl-10"
                />
              </div>
              
              <div>
                <Label htmlFor="role" className="text-sm font-medium">
                  Role
                </Label>
                <select
                  id="role"
                  name="role"
                  defaultValue={filters.role || ""}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Roles</option>
                  <option value="STUDENT">Student</option>
                  <option value="TUTOR">Tutor</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                  <option value="EMPLOYER">Employer</option>
                </select>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium">
                  Status
                </Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={filters.status || ""}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="INVITED">Invited</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  Apply Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {result.users.length} of {result.pagination.total} users
          </p>
          <Badge variant="outline">
            Page {result.pagination.page} of {result.pagination.totalPages}
          </Badge>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users ({result.pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      User
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Activity
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Joined
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.users.map((user) => {
                    const roleLabel = (user.role ?? "STUDENT").toString().replace("_", " ");
                    const statusLabel = (user.status ?? "ACTIVE").toString();
                    const created = user.createdAt ? new Date(user.createdAt) : null;
                    return (
                    <tr key={user.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          {user.profile?.headline && (
                            <div className="text-xs text-gray-400 mt-1">
                              {user.profile.headline}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={roleColors[user.role as keyof typeof roleColors] ?? "bg-slate-100 text-slate-700"}>
                          {roleLabel}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[user.status as keyof typeof statusColors] ?? "bg-slate-100 text-slate-700"}>
                          {statusLabel}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm space-y-1">
                          <div>
                            {user._count?.enrollments || 0} enrollments
                          </div>
                          <div>
                            {user._count?.jobApplications || 0} applications
                          </div>
                          <div>
                            {user._count?.forumThreads || 0} threads
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-500">
                          {created ? created.toLocaleDateString() : "—"}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <form
                            action={async (formData: FormData) => {
                              "use server";
                              const newRole = formData.get("role") as AdminRole;
                              await updateUserRole(user.id, newRole);
                            }}
                            className="flex items-center gap-1"
                          >
                            <select name="role" defaultValue={user.role} className="text-xs px-2 py-1 border rounded">
                              <option value="STUDENT">Student</option>
                              <option value="TUTOR">Tutor</option>
                              <option value="ADMIN">Admin</option>
                              <option value="SUPER_ADMIN">Super Admin</option>
                            </select>
                            <Button type="submit" size="sm" variant="outline">
                              Update
                            </Button>
                          </form>

                          <form
                            action={async (formData: FormData) => {
                              "use server";
                              const newStatus = formData.get("status") as UserStatus;
                              await updateUserStatus(user.id, newStatus);
                            }}
                            className="flex items-center gap-1"
                          >
                            <select name="status" defaultValue={user.status} className="text-xs px-2 py-1 border rounded">
                              <option value="ACTIVE">Active</option>
                              <option value="SUSPENDED">Suspended</option>
                              <option value="INVITED">Invited</option>
                            </select>
                            <Button type="submit" size="sm" variant="outline">
                              Update
                            </Button>
                          </form>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {result.users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No users found matching the current filters.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {result.pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={result.pagination.page <= 1}
            >
              <a
                href={`?page=${Math.max(result.pagination.page - 1, 1)}&role=${filters.role || ""}&status=${filters.status || ""}&search=${filters.search || ""}`}
              >
                Previous
              </a>
            </Button>
            {buildPageRange(result.pagination.page, result.pagination.totalPages).map((page) => (
              <Button
                key={page}
                variant={page === result.pagination.page ? "default" : "outline"}
                size="sm"
                asChild
              >
                <a href={`?page=${page}&role=${filters.role || ""}&status=${filters.status || ""}&search=${filters.search || ""}`}>
                  {page}
                </a>
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              asChild
              disabled={result.pagination.page >= result.pagination.totalPages}
            >
              <a
                href={`?page=${Math.min(result.pagination.page + 1, result.pagination.totalPages)}&role=${filters.role || ""}&status=${filters.status || ""}&search=${filters.search || ""}`}
              >
                Next
              </a>
            </Button>
          </div>
        )}
      </AdminShell>
    </div>
  );
}
