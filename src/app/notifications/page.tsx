import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { verifyToken } from "@/lib/auth/jwt";
import { listUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } from "@/features/notifications/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getUserFromSession() {
  const store = await cookies();
  const accessToken = store.get("access_token")?.value;
  if (!accessToken) return null;
  try {
    return verifyToken(accessToken);
  } catch {
    return null;
  }
}

async function markAsReadAction(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  await markNotificationAsRead(id);
  revalidatePath("/notifications");
}

async function markAllAsReadAction() {
  "use server";

  const store = await cookies();
  const accessToken = store.get("access_token")?.value;
  if (!accessToken) return;

  const user = verifyToken(accessToken);
  await markAllNotificationsAsRead(user.sub);
  revalidatePath("/notifications");
}

export default async function NotificationsPage() {
  const user = await getUserFromSession();
  if (!user) {
    redirect("/login");
  }

  const notifications = await listUserNotifications(user.sub);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Notifications</h1>
            <p className="text-slate-600">Updates and alerts for your account.</p>
          </div>
          {notifications.some((n) => !n.readAt) && (
            <form action={markAllAsReadAction}>
              <Button variant="outline" size="sm">
                Mark all as read
              </Button>
            </form>
          )}
        </header>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card className="border border-slate-200/70 bg-white/95">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-slate-500">No notifications yet.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => {
              const payload = notification.payload as any;
              return (
                <Card
                  key={notification.id}
                  className={`border border-slate-200/70 bg-white/95 transition-colors ${
                    !notification.readAt ? "border-primary/30 bg-primary/5" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{payload.title || "Notification"}</h3>
                          {!notification.readAt && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        {payload.body && (
                          <p className="text-sm text-slate-600">{payload.body}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="capitalize">{notification.type.toLowerCase().replace("_", " ")}</span>
                          <span>{notification.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {payload.actionUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={payload.actionUrl}>View</a>
                          </Button>
                        )}
                        {!notification.readAt && (
                          <form action={markAsReadAction}>
                            <input type="hidden" name="id" value={notification.id} />
                            <Button variant="ghost" size="sm" type="submit">
                              Mark read
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
