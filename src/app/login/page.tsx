import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginUser } from "@/features/auth/service";
import { LoginSchema } from "@/features/auth/schemas";
import { siteConfig } from "@/config/site";

async function loginAction(formData: FormData) {
  "use server";

  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return;
  }

  try {
    const { accessToken, refreshToken } = await loginUser(parsed.data);
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

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <Card className="w-full max-w-md border border-slate-200/70 bg-white/95 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-slate-900">Sign in</CardTitle>
          <CardDescription>
            Welcome back to {siteConfig.name}. Enter your credentials to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" action={loginAction}>
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
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-600">
            No account?{" "}
            <a href="/register" className="font-semibold text-primary hover:underline">
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
