import { revalidatePath } from "next/cache";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createNewsPost, listNewsPosts, updateNewsPost } from "@/features/news/service";
import { CreateNewsSchema } from "@/features/news/schemas";
import { NEWS_STATUSES, type NewsStatus } from "@/features/news/constants";
import { requireAdminUser } from "@/features/admin/service";
import { AdminShell } from "../_components/admin-shell";

async function createNewsAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const parsed = CreateNewsSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    summary: formData.get("summary"),
    tags: formData.get("tags") ? (formData.get("tags") as string).split(",").map((t) => t.trim()) : [],
  });

  if (!parsed.success) {
    return;
  }

  // TODO: get authorId from session
  const authorId = "demo_admin";

  await createNewsPost({ ...parsed.data, authorId });
  revalidatePath("/admin/news");
}

async function updateNewsStatusAction(formData: FormData) {
  "use server";

  await requireAdminUser();

  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").toUpperCase() as NewsStatus;

  if (!id) {
    return;
  }

  await updateNewsPost(id, { status });
  revalidatePath("/admin/news");
}

export default async function AdminNewsPage() {
  const [admin, posts] = await Promise.all([requireAdminUser(), listNewsPosts()]);

  return (
    <div className="space-y-8">
      <AdminShell
        title="News"
        description="Manage announcements, updates, and editorial content."
        actions={<Badge variant="secondary">{admin.role.replace("_", " ")} access</Badge>}
      >
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">All posts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-500">
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Author</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Created</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {posts.map((post: any) => (
                      <tr key={post.id} className="text-slate-700">
                        <td className="py-3 font-semibold">{post.title}</td>
                        <td>
                          {post.author.firstName} {post.author.lastName}
                        </td>
                        <td>
                          <Badge variant="outline" className="capitalize">
                            {post.status.toLowerCase()}
                          </Badge>
                        </td>
                        <td>
                          {new Intl.DateTimeFormat("en", {
                            month: "short",
                            day: "numeric",
                          }).format(post.createdAt)}
                        </td>
                        <td>
                          <form action={updateNewsStatusAction} className="inline-flex">
                            <input type="hidden" name="id" value={post.id} />
                            <select
                              name="status"
                              defaultValue={post.status}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                            >
                              {NEWS_STATUSES.map((option) => (
                                <option key={option} value={option}>
                                  {option.toLowerCase()}
                                </option>
                              ))}
                            </select>
                            <Button type="submit" size="sm" className="ml-2 text-xs">
                              Update
                            </Button>
                          </form>
                        </td>
                      </tr>
                    ))}
                    {posts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                          No news posts yet. Use the form to create the first announcement.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/70 bg-white/95">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">Create post</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" action={createNewsAction}>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Title</Label>
                  <Input name="title" placeholder="New feature release" required />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Summary</Label>
                  <Input name="summary" placeholder="Brief overview (optional)" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Content</Label>
                  <Textarea name="content" placeholder="Full post content..." rows={6} required />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700">Tags</Label>
                  <Input name="tags" placeholder="product, update, announcement (comma-separated)" />
                </div>
                <Button type="submit" className="w-full">
                  Create draft
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </AdminShell>
    </div>
  );
}
