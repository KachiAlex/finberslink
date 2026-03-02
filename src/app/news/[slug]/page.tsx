import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNewsPostBySlug } from "@/features/news/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getNewsPostBySlug(slug);
  if (!post || (post as any).status !== "PUBLISHED") {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <Card className="border border-slate-200/70 bg-white/95">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-semibold text-slate-900">{(post as any).title}</CardTitle>
              <Badge variant="outline" className="capitalize">
                {(post as any).status.toLowerCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>
                By {(post as any).author.firstName} {(post as any).author.lastName}
              </span>
              <span>·</span>
              <span>{(post as any).publishedAt?.toLocaleDateString() || (post as any).createdAt.toLocaleDateString()}</span>
            </div>
            {(post as any).tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {(post as any).tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none">
              {(post as any).content.split("\n").map((paragraph: string, i: number) => (
                <p key={i} className="mb-4 text-slate-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </article>
    </main>
  );
}
