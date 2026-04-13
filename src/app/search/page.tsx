import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { searchAll } from "@/features/search/service";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q || "";
  const results = query ? await searchAll(query) : [];

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-semibold text-slate-900">Search</h1>
          <p className="text-slate-600">Find courses, jobs, forum threads, and news.</p>
        </header>

        <Card className="border border-slate-200/70 bg-white/95">
          <CardContent className="p-6">
            <form action="/search" method="get" className="flex gap-2">
              <Input
                name="q"
                placeholder="Search..."
                defaultValue={query}
                className="flex-1"
              />
              <Button type="submit">Search</Button>
            </form>
          </CardContent>
        </Card>

        {!query ? (
          <Card className="border border-slate-200/70 bg-white/95">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-slate-500">Enter a search term to find results.</p>
            </CardContent>
          </Card>
        ) : results.length === 0 ? (
          <Card className="border border-slate-200/70 bg-white/95">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-slate-500">No results found for &quot;{query}&quot;.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Results for &quot;{query}&quot;
              </h2>
              <Badge variant="outline">{results.length} results</Badge>
            </div>

            <div className="space-y-4">
              {results.map((result) => (
                <Card key={`${result.type}-${result.id}`} className="border border-slate-200/70 bg-white/95">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        {result.title}
                      </CardTitle>
                      <Badge variant="secondary" className="capitalize">
                        {result.type}
                      </Badge>
                    </div>
                    {result.description && (
                      <CardDescription>{result.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(result.metadata || {}).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {String(value)}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={result.url}>View</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
