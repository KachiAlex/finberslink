import { ArrowLeft, Calendar, Mail, MapPin, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserById, updateUserRole, updateUserStatus } from "@/features/admin/service";

type Role = 'ADMIN' | 'SUPER_ADMIN' | 'STUDENT' | 'TUTOR';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

import { AdminShell } from "../../_components/admin-shell";

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

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const user = await getUserById(userId);

  if (!user) {
    return (
      <AdminShell
        title="User Not Found"
        description="The requested user could not be found."
      >
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">User not found</p>
          <Button asChild>
            <a href="/admin/users">Back to Users</a>
          </Button>
        </div>
      </AdminShell>
    );
  }

  return (
    <div className="space-y-6">
      <AdminShell
        title="User Details"
        description="View and manage user information and activity."
      >
        {/* Back Button */}
        <Button variant="outline" asChild>
          <a href="/admin/users" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </a>
        </Button>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <p>{user.email}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Headline</label>
                  <p>{(user as any).profile?.headline || "No headline set"}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <p>{(user as any).profile?.location || "No location set"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <div className="flex items-center gap-2">
                    <Badge className={roleColors[user.role]}>
                      {user.role.replace("_", " ")}
                    </Badge>
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
                        className="text-sm px-2 py-1 border rounded"
                        onChange={(e) => e.target.form?.requestSubmit()}
                      >
                        <option value="STUDENT">Student</option>
                        <option value="TUTOR">Tutor</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="EMPLOYER">Employer</option>
                      </select>
                    </form>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[user.status as keyof typeof statusColors]}>
                      {user.status}
                    </Badge>
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
                        className="text-sm px-2 py-1 border rounded"
                        onChange={(e) => e.target.form?.requestSubmit()}
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                        <option value="INVITED">Invited</option>
                      </select>
                    </form>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Joined</label>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <p>{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p>{new Date(user.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {(user as any)._count?.enrollments || 0}
                </div>
                <div className="text-sm text-gray-600">Enrollments</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(user as any)._count?.jobApplications || 0}
                </div>
                <div className="text-sm text-gray-600">Applications</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {(user as any)._count?.forumThreads || 0}
                </div>
                <div className="text-sm text-gray-600">Threads</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {(user as any)._count?.forumPosts || 0}
                </div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <div className="text-2xl font-bold text-pink-600">
                  {(user as any)._count?.resumes || 0}
                </div>
                <div className="text-sm text-gray-600">Resumes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Enrollments */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              {(user as any).enrollments?.length > 0 ? (
                <div className="space-y-3">
                  {(user as any).enrollments.map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {enrollment.course.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {enrollment.status}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/courses/${enrollment.course.slug}`}>
                          View
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No enrollments yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {(user as any).jobApplications?.length > 0 ? (
                <div className="space-y-3">
                  {(user as any).jobApplications.map((application: any) => (
                    <div
                      key={application.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {application.opportunity.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {application.opportunity.company}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {application.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No applications yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    </div>
  );
}
