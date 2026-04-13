import { revalidatePath } from "next/cache";
import { Users, ShieldCheck, Crown, UserCog, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/ui/stat-card";
import {
  updateUserRole,
  requireAdminUser,
  getSystemSnapshot,
  toggleFeatureFlag,
  createTenantInvite,
  listTenantInvites,
} from "@/features/admin/service";

import { AdminShell } from "../_components/admin-shell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function updateAdminRoleAction(formData: FormData) {
  "use server";

  const admin = await requireAdminUser();
  if (admin.role !== "SUPER_ADMIN") {
    throw new Error("Only super admins can change roles");
  }

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");

  if (!userId || !role) return;

  await updateUserRole(userId, role as "ADMIN" | "SUPER_ADMIN");
  revalidatePath("/admin/system");
}

async function toggleFeatureFlagAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const key = String(formData.get("key") ?? "");
  const enabled = formData.get("enabled") === "true";

  if (!key) return;

  await toggleFeatureFlag(key, enabled);
  revalidatePath("/admin/system");
}

async function createInviteAction(formData: FormData) {
  "use server";

  const admin = await requireAdminUser();
  if (!admin.tenantId) {
    throw new Error("Invites require tenant context");
  }

  const email = String(formData.get("email") ?? "").toLowerCase();
  const role = String(formData.get("role") ?? "");
  const days = Number(formData.get("expiresIn") ?? "7");

  if (!email || !role) return;

  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await createTenantInvite({
    tenantId: admin.tenantId,
    email,
    role: role as "STUDENT" | "TUTOR",
    createdById: admin.id,
    expiresAt,
  });

  revalidatePath("/admin/system");
}

export default async function AdminSystemPage() {
  const admin = await requireAdminUser(undefined, { allowNoTenant: true });
  const system = await getSystemSnapshot();
  const invites = admin.tenantId ? await listTenantInvites(admin.tenantId) : [];
  const inviteBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "";

  const statCards = [
    {
      title: "Total users",
      value: system.stats.totalUsers,
      trend: { value: 6, isPositive: true },
      icon: Users,
    },
    {
      title: "Admin seats",
      value: system.stats.admins,
      trend: { value: 1, isPositive: true },
      icon: ShieldCheck,
    },
    {
      title: "Super admins",
      value: system.stats.superAdmins,
      trend: { value: 0, isPositive: false },
      icon: Crown,
    },
    {
      title: "Invited / Suspended",
      value: `${system.stats.invitedUsers}/${system.stats.suspendedUsers}`,
      trend: { value: 3, isPositive: true },
      icon: UserCog,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <AdminShell
        title="System control"
        description="Govern roles, platform feature flags, and audit activity from a single console."
        actions={<Badge variant="secondary">{admin.role.replace("_", " ")} access</Badge>}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              className="bg-gradient-to-br from-white to-slate-50"
            />
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                Admin roster
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {system.adminUsers.length === 0 && (
                <p className="text-sm text-slate-500">No administrators found.</p>
              )}
              <div className="space-y-3">
                {system.adminUsers.map((user) => (
                  <div
                    key={user.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {user.role.toLowerCase()}
                        </Badge>
                        <Badge variant={user.status === "ACTIVE" ? "secondary" : "outline"}>
                          {user.status.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{user._count?.jobOpportunitiesPosted ?? 0} jobs</span>
                      <span>{user._count?.coursesTaught ?? 0} courses</span>
                      <span>
                        Added{" "}
                        {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
                          user.createdAt,
                        )}
                      </span>
                    </div>
                    {admin.role === "SUPER_ADMIN" ? (
                      <form action={updateAdminRoleAction} className="mt-3 flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                        <Button size="sm" variant="outline">
                          Update
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border border-slate-200/70 bg-white/95">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Invite tutors & students
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form action={createInviteAction} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600" htmlFor="invite-email">
                      Email
                    </label>
                    <Input id="invite-email" name="email" type="email" placeholder="person@org.com" required />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">Role</label>
                      <select
                        name="role"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        defaultValue="STUDENT"
                      >
                        <option value="STUDENT">Student</option>
                        <option value="TUTOR">Tutor</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">Expires in</label>
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
                  <Button type="submit" className="w-full">
                    Generate invite link
                  </Button>
                </form>

                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent invites</p>
                  {invites.length === 0 && (
                    <p className="text-sm text-slate-500">No invites yet. Generated links will appear here.</p>
                  )}
                  <div className="space-y-2">
                    {invites.map((invite) => {
                      const inviteLink = `${inviteBaseUrl}/join/${invite.token}`;
                      return (
                        <div
                          key={invite.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-xs text-slate-600"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {invite.role.toLowerCase()}
                            </Badge>
                            <Badge variant={invite.status === "PENDING" ? "secondary" : "outline"} className="uppercase">
                              {invite.status.toLowerCase()}
                            </Badge>
                            <span className="text-slate-500">{invite.email}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            Exp.{" "}
                            {new Intl.DateTimeFormat("en", {
                              month: "short",
                              day: "numeric",
                            }).format(invite.expiresAt)}
                          </p>
                          <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1">
                            <Link2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate text-[11px] text-slate-500">{inviteLink}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/70 bg-white/95">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Feature flags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {system.featureFlags.map((flag) => (
                  <form
                    key={flag.key}
                    action={toggleFeatureFlagAction}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{flag.name}</p>
                        <p className="text-xs text-slate-500">{flag.description}</p>
                      </div>
                      <Badge variant={flag.enabled ? "secondary" : "outline"}>
                        {flag.enabled ? "enabled" : "disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Source: {flag.source}</span>
                      <input type="hidden" name="key" value={flag.key} />
                      <input type="hidden" name="enabled" value={(!flag.enabled).toString()} />
                      <Button size="sm" variant="outline">
                        {flag.enabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </form>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-slate-200/70 bg-slate-900 text-white">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Audit trail</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {system.auditTrail.length === 0 && (
                  <p className="text-sm text-white/70">No recent system events logged.</p>
                )}
                {system.auditTrail.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-white">{entry.label}</p>
                      <Badge variant="outline" className="border-white/30 text-xs capitalize text-white">
                        {entry.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/70">{entry.meta}</p>
                    <p className="mt-2 text-xs text-white/50">
                      {new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(
                        entry.timestamp,
                      )}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminShell>
    </div>
  );
}
