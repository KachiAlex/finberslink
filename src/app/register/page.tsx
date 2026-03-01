import { redirect } from "next/navigation";
import { cookies } from "next/headers";

type Role = 'ADMIN' | 'SUPER_ADMIN' | 'STUDENT' | 'TUTOR';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/features/auth/service";
import { RegisterSchema } from "@/features/auth/schemas";
import { siteConfig } from "@/config/site";

async function registerAction(formData: FormData) {
  "use server";

  const parsed = RegisterSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role") ? (formData.get("role") as Role) : undefined,
  });

  if (!parsed.success) {
    return;
  }

  try {
    const { accessToken, refreshToken } = await registerUser(parsed.data);
    const store = await cookies();
    store.set("access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15, // 15 minutes
    });
    store.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  } catch (err) {
    // TODO: surface errors to UI
    return;
  }

  redirect("/dashboard");
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <Card className="w-full max-w-md border border-slate-200/70 bg-white/95 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-slate-900">Create account</CardTitle>
          <CardDescription>
            Join {siteConfig.name}. Fill in your details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={registerAction}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Ada"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Eze"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role (optional)</Label>
              <select
                id="role"
                name="role"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Select role (defaults to Student)</option>
                {Object.values(Role).map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <a href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
