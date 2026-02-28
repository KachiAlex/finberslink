import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listPublishedNewsPosts } from "@/features/news/service";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewsPage() {
  const posts = await listPublishedNewsPosts();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="text-center">
          <h1 className="text-3xl font-semibold text-slate-900">News & Updates</h1>
          <p className="text-slate-600">Latest announcements and insights from the Finbers Link team.</p>
        </header>

        {posts.length === 0 ? (
          <Card className="border border-slate-200/70 bg-white/95">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-slate-500">No news published yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="border border-slate-200/70 bg-white/95">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-slate-900">{post.title}</CardTitle>
                    <Badge variant="outline" className="capitalize">
                      {post.status.toLowerCase()}
                    </Badge>
                  </div>
                  <CardDescription>
                    By {post.author.firstName} {post.author.lastName} ·{" "}
                    {post.publishedAt?.toLocaleDateString() || post.createdAt.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {post.summary && (
                    <p className="text-slate-600 mb-4">{post.summary}</p>
                  )}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" asChild>
                    <Link href={`/news/${post.slug}`}>Read more</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
