import { ArrowUpDown, Filter, Search, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listAllUsers, updateUserRole, updateUserStatus } from "@/features/admin/service";
import { Role, UserStatus } from "@prisma/client";

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

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    status?: string;
    search?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const filters = {
    role: params.role as Role,
    status: params.status as UserStatus,
    search: params.search,
    page: params.page ? parseInt(params.page) : 1,
  };

  const result = await listAllUsers(filters);

  return (
    <div className="space-y-6">
      <AdminShell
        title="User Management"
        description="Manage all platform users, roles, and permissions."
      >
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
                  {result.users.map((user) => (
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
                        <Badge className={roleColors[user.role]}>
                          {user.role.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={statusColors[user.status]}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm space-y-1">
                          <div>
                            {user._count.enrollments} enrollments
                          </div>
                          <div>
                            {user._count.jobApplications} applications
                          </div>
                          <div>
                            {user._count.forumThreads} threads
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <form
                            action={async (formData: FormData) => {
                              "use server";
                              const newRole = formData.get("role") as Role;
                              await updateUserRole(user.id, newRole);
                            }}
                          >
                            <select
                              name="role"
                              defaultValue={user.role}
                              className="text-xs px-2 py-1 border rounded"
                              onChange={(e) => e.target.form?.requestSubmit()}
                            >
                              <option value="STUDENT">Student</option>
                              <option value="TUTOR">Tutor</option>
                              <option value="ADMIN">Admin</option>
                              <option value="SUPER_ADMIN">Super Admin</option>
                              <option value="EMPLOYER">Employer</option>
                            </select>
                          </form>
                          
                          <form
                            action={async (formData: FormData) => {
                              "use server";
                              const newStatus = formData.get("status") as UserStatus;
                              await updateUserStatus(user.id, newStatus);
                            }}
                          >
                            <select
                              name="status"
                              defaultValue={user.status}
                              className="text-xs px-2 py-1 border rounded"
                              onChange={(e) => e.target.form?.requestSubmit()}
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="SUSPENDED">Suspended</option>
                              <option value="INVITED">Invited</option>
                            </select>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
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
            {Array.from({ length: result.pagination.totalPages }, (_, i) => i + 1).map(
              (page) => (
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
              )
            )}
          </div>
        )}
      </AdminShell>
    </div>
  );
}
