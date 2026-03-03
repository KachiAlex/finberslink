import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Calendar, CheckCircle2, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getInviteByToken, markInviteStatus } from "@/features/admin/service";
import { registerUser } from "@/features/auth/service";

type JoinPageProps = {
  params: { token: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

const errorMessages: Record<string, string> = {
  invalid: "This invite link is invalid or has been revoked.",
  expired: "This invite link has expired. Ask the admin for a fresh invite.",
  used: "This invite has already been accepted.",
  missing: "Please fill in all required fields.",
  password: "Passwords must be at least 8 characters and match each other.",
  existing: "An account with this email already exists. Try signing in instead.",
  server: "Something went wrong while creating your account. Please try again.",
};

async function acceptInviteAction(formData: FormData) {
  "use server";

  const token = String(formData.get("token") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const redirectBase = `/join/${token}`;

  if (!token || !firstName || !lastName || !password || !confirmPassword) {
    redirect(`${redirectBase}?error=missing`);
  }

  if (password.length < 8 || password !== confirmPassword) {
    redirect(`${redirectBase}?error=password`);
  }

  const invite = await getInviteByToken(token);

  if (!invite) {
    redirect(`${redirectBase}?error=invalid`);
  }

  if (invite.status === "EXPIRED") {
    redirect(`${redirectBase}?error=expired`);
  }

  if (invite.status !== "PENDING") {
    redirect(`${redirectBase}?error=used`);
  }

  try {
    const tokens = await registerUser(
      {
        firstName,
        lastName,
        email: invite.email,
        password,
        role: invite.role as "STUDENT" | "TUTOR",
      },
      invite.tenantId,
    );

    await markInviteStatus(invite.id, "ACCEPTED");

    const cookieStore = cookies();
    const secure = process.env.NODE_ENV === "production";

    cookieStore.set("access_token", tokens.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: 60 * 15,
      path: "/",
    });

    cookieStore.set("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    const destination = invite.role === "TUTOR" ? "/tutor" : "/dashboard";
    redirect(destination);
  } catch (error) {
    if (error instanceof Error && error.message.toLowerCase().includes("exists")) {
      redirect(`${redirectBase}?error=existing`);
    }

    console.error("Invite acceptance error:", error);
    redirect(`${redirectBase}?error=server`);
  }
}

export default async function JoinPage({ params, searchParams }: JoinPageProps) {
  const invite = await getInviteByToken(params.token);
  const errorKey = typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const errorMessage = errorKey ? errorMessages[errorKey] ?? errorMessages.server : undefined;

  const inviteActive = invite && invite.status === "PENDING";

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-900/60 via-slate-950 to-black" />
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.25),_transparent_65%)]" />
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Finbers Link</p>
            <h1 className="text-3xl font-semibold">Accept your invitation</h1>
            <p className="text-sm text-white/70">
              Finish setting up your account to access the {invite?.tenant?.name ?? "Finbers"} workspace.
            </p>
          </div>

          <Card className="border border-white/10 bg-white/5 text-white backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                {invite ? `Join ${invite.tenant?.name ?? "Finbers Link"}` : "Invite not found"}
              </CardTitle>
              <CardDescription className="text-white/70">
                {inviteActive
                  ? `You're joining as a ${invite.role.toLowerCase()} using ${invite.email}`
                  : "We couldn't activate this invite. Reach out to your admin for another link."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {errorMessage ? (
                <div className="rounded-2xl border border-red-200/30 bg-red-500/10 p-4 text-sm text-red-100">
                  {errorMessage}
                </div>
              ) : null}

              {invite ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-white/50">Workspace</p>
                      <p className="text-base font-semibold text-white">
                        {invite.tenant?.name ?? "Finbers Link"}
                      </p>
                      <p className="text-sm text-white/70">{invite.email}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Badge className="bg-emerald-500/20 text-emerald-200">
                        <Shield className="mr-1 h-3.5 w-3.5" />
                        {invite.role.toLowerCase()}
                      </Badge>
                      <Badge variant="outline" className="border-white/30 text-white">
                        <Calendar className="mr-1 h-3.5 w-3.5" />
                        Expires{" "}
                        {new Intl.DateTimeFormat("en", {
                          month: "short",
                          day: "numeric",
                        }).format(invite.expiresAt)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : null}

              {inviteActive ? (
                <form action={acceptInviteAction} className="space-y-4">
                  <input type="hidden" name="token" value={params.token} />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-white/80">First name</label>
                      <Input
                        name="firstName"
                        placeholder="Ada"
                        required
                        className="mt-1 border-white/10 bg-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-white/80">Last name</label>
                      <Input
                        name="lastName"
                        placeholder="Okafor"
                        required
                        className="mt-1 border-white/10 bg-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/80">Password</label>
                    <Input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="mt-1 border-white/10 bg-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white/80">Confirm password</label>
                    <Input
                      name="confirmPassword"
                      type="password"
                      placeholder="Repeat password"
                      required
                      className="mt-1 border-white/10 bg-white/10 text-white placeholder:text-white/40"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/80">Welcome note (optional)</label>
                    <Textarea
                      name="bio"
                      placeholder="Share your current focus or experience. This helps admins place you into the right cohorts."
                      className="mt-1 border-white/10 bg-white/10 text-white placeholder:text-white/40"
                      rows={3}
                      disabled
                    />
                    <p className="mt-2 text-xs text-white/50">
                      We'll capture richer profile data after you sign in.
                    </p>
                  </div>

                  <Button type="submit" className="w-full bg-white text-slate-900 hover:bg-white/90">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Activate account
                  </Button>
                </form>
              ) : (
                <div className="text-sm text-white/70">
                  This link can no longer be used. Contact your Finbers admin to request another invite.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
